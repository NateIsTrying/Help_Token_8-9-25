
  // backend/src/routes/auth.ts
  import express from 'express';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import { body, validationResult } from 'express-validator';
  import { supabase } from '../index';
  import logger from '../utils/logger';
  
  const router = express.Router();
  
  // Register
  router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1 }),
    body('wallet_address').optional().isEthereumAddress(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password, name, wallet_address } = req.body;
  
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
  
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
  
      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password: hashedPassword,
          name,
          wallet_address,
          role: 'volunteer',
          balance: 0,
          total_hours: 0,
          total_projects: 0,
          people_impacted: 0,
          city_ranking: 0
        })
        .select()
        .single();
  
      if (error) {
        logger.error('User creation error:', error);
        return res.status(500).json({ message: 'Failed to create user' });
      }
  
      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
  
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
  
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          wallet_address: user.wallet_address,
          balance: user.balance
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Refresh token
  router.post('/refresh', async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Generate new token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
  
      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  });
  
  export default router;
  
