  // backend/src/routes/opportunities.ts
  import express from 'express';
  import { body, validationResult } from 'express-validator';
  import { supabase } from '../index';
  import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
  import logger from '../utils/logger';
  
  const router = express.Router();
  
  // Get all active opportunities
  router.get('/', async (req, res) => {
    try {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
  
      if (error) {
        logger.error('Error fetching opportunities:', error);
        return res.status(500).json({ message: 'Failed to fetch opportunities' });
      }
  
      res.json(opportunities);
    } catch (error) {
      logger.error('Opportunities fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get opportunity by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error || !opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
  
      res.json(opportunity);
    } catch (error) {
      logger.error('Opportunity fetch error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create opportunity (municipal admin only)
  router.post('/', authMiddleware, requireRole(['municipal_admin']), [
    body('title').trim().isLength({ min: 1, max: 255 }),
    body('description').trim().isLength({ min: 1 }),
    body('reward_rate').isFloat({ min: 1, max: 5 }),
    body('category').trim().isLength({ min: 1 }),
    body('organization').trim().isLength({ min: 1 }),
    body('location').trim().isLength({ min: 1 }),
  ], async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const {
        title,
        description,
        reward_rate,
        category,
        organization,
        location,
        distance = 0,
        priority = 'medium'
      } = req.body;
  
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          title,
          description,
          reward_rate,
          category,
          organization,
          location,
          distance,
          priority,
          active: true,
          created_by: req.user!.id
        })
        .select()
        .single();
  
      if (error) {
        logger.error('Opportunity creation error:', error);
        return res.status(500).json({ message: 'Failed to create opportunity' });
      }
  
      res.status(201).json(opportunity);
    } catch (error) {
      logger.error('Opportunity creation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update opportunity
  router.put('/:id', authMiddleware, requireRole(['municipal_admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .eq('created_by', req.user!.id)
        .select()
        .single();
  
      if (error) {
        return res.status(404).json({ message: 'Opportunity not found or unauthorized' });
      }
  
      res.json(opportunity);
    } catch (error) {
      logger.error('Opportunity update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Deactivate opportunity
  router.delete('/:id', authMiddleware, requireRole(['municipal_admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
  
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .update({ active: false })
        .eq('id', id)
        .eq('created_by', req.user!.id)
        .select()
        .single();
  
      if (error) {
        return res.status(404).json({ message: 'Opportunity not found or unauthorized' });
      }
  
      res.json({ message: 'Opportunity deactivated successfully' });
    } catch (error) {
      logger.error('Opportunity deletion error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  export default router;
  
  