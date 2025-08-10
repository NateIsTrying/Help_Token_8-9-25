// backend/src/routes/verification.ts
import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../index';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchain';
import logger from '../utils/logger';

const router = express.Router();

// Submit volunteer session for verification
router.post('/session', [
  body('opportunity_id').isInt({ min: 1 }),
  body('hours').isFloat({ min: 0.5, max: 12 }),
  body('description').optional().trim(),
  body('photo_url').optional().isURL(),
  body('location.latitude').optional().isFloat(),
  body('location.longitude').optional().isFloat(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      opportunity_id,
      hours,
      description,
      photo_url,
      location
    } = req.body;

    // Check if opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .eq('active', true)
      .single();

    if (oppError || !opportunity) {
      return res.status(404).json({ message: 'Opportunity not found or inactive' });
    }

    // Calculate tokens earned
    const tokensEarned = hours * opportunity.reward_rate;

    // Create volunteer session record
    const { data: session, error } = await supabase
      .from('volunteer_sessions')
      .insert({
        opportunity_id,
        volunteer_id: req.user!.id,
        hours,
        tokens_earned: tokensEarned,
        description,
        photo_url,
        latitude: location?.latitude,
        longitude: location?.longitude,
        status: 'pending_verification',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Session creation error:', error);
      return res.status(500).json({ message: 'Failed to create session' });
    }

    // Notify municipal admins (in a real app, you'd send notifications)
    logger.info(`New volunteer session submitted: ${session.id}`);

    res.status(201).json({
      message: 'Volunteer session submitted for verification',
      session
    });
  } catch (error) {
    logger.error('Session submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify volunteer session (municipal admin/verifier only)
router.put('/session/:id', requireRole(['municipal_admin', 'verifier']), [
  body('approved').isBoolean(),
  body('notes').optional().trim(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { approved, notes } = req.body;

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('volunteer_sessions')
      .select('*, opportunities(*), users(*)')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'pending_verification') {
      return res.status(400).json({ message: 'Session already processed' });
    }

    const status = approved ? 'verified' : 'rejected';
    
    // Update session
    const { error: updateError } = await supabase
      .from('volunteer_sessions')
      .update({
        status,
        verifier_id: req.user!.id,
        verifier_notes: notes,
        verified_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Session update error:', updateError);
      return res.status(500).json({ message: 'Failed to update session' });
    }

    if (approved) {
      // Update user stats
      await supabase
        .from('users')
        .update({
          balance: session.users.balance + session.tokens_earned,
          total_hours: session.users.total_hours + session.hours,
          total_projects: session.users.total_projects + 1
        })
        .eq('id', session.volunteer_id);

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: session.volunteer_id,
          type: 'earn',
          amount: session.tokens_earned,
          description: `${session.opportunities.title} (${session.hours} hours)`,
          volunteer_session_id: session.id
        });

      // Try to record on blockchain (optional, may fail)
      try {
        const blockchainService = new BlockchainService();
        await blockchainService.recordVolunteerSession(
          session.opportunity_id,
          session.users.wallet_address,
          Math.floor(session.hours * 60) // Convert to minutes
        );
      } catch (blockchainError) {
        logger.warn('Blockchain recording failed:', blockchainError);
        // Continue without blockchain - can be retried later
      }
    }

    res.json({
      message: `Session ${approved ? 'approved' : 'rejected'} successfully`,
      session: { id, status }
    });
  } catch (error) {
    logger.error('Session verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending verifications (for admins)
router.get('/pending', requireRole(['municipal_admin', 'verifier']), async (req: AuthRequest, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('volunteer_sessions')
      .select('*, opportunities(*), users(name, email)')
      .eq('status', 'pending_verification')
      .order('submitted_at', { ascending: true });

    if (error) {
      logger.error('Error fetching pending sessions:', error);
      return res.status(500).json({ message: 'Failed to fetch pending sessions' });
    }

    res.json(sessions);
  } catch (error) {
    logger.error('Pending sessions fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

