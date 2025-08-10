  // backend/src/index.ts
  import express from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import compression from 'compression';
  import rateLimit from 'express-rate-limit';
  import slowDown from 'express-slow-down';
  import dotenv from 'dotenv';
  import { createClient } from '@supabase/supabase-js';
  import logger from './utils/logger';
  import { errorHandler } from './middleware/errorHandler';
  import { authMiddleware } from './middleware/auth';
  
  // Route imports
  import authRoutes from './routes/auth';
  import userRoutes from './routes/users';
  import opportunityRoutes from './routes/opportunities';
  import marketplaceRoutes from './routes/marketplace';
  import verificationRoutes from './routes/verification';
  import adminRoutes from './routes/admin';
  import blockchainRoutes from './routes/blockchain';
  
  dotenv.config();
  
  const app = express();
  const PORT = process.env.PORT || 8000;
  
  // Supabase client
  export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: 500 // add 500ms delay per request after delayAfter
  });
  
  // Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(limiter);
  app.use(speedLimiter);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/users', authMiddleware, userRoutes);
  app.use('/opportunities', opportunityRoutes);
  app.use('/marketplace', marketplaceRoutes);
  app.use('/verify', authMiddleware, verificationRoutes);
  app.use('/admin', authMiddleware, adminRoutes);
  app.use('/blockchain', blockchainRoutes);
  
  // Error handling
  app.use(errorHandler);
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
  
  export default app;
  
  // backend/src/middleware/auth.ts
  import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';
  import { supabase } from '../index';
  import logger from '../utils/logger';
  
  export interface AuthRequest extends Request {
    user?: {
      id: number;
      email: string;
      role: string;
      wallet_address?: string;
    };
  }
  
  export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
  
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Fetch user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
  
      if (error || !user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      req.user = user;
      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
  
  export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  };
  