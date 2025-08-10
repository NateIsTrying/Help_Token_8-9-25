// backend/database/init.sql
-- Database initialization script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(42) UNIQUE,
  role VARCHAR(50) DEFAULT 'volunteer',
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_hours DECIMAL(8,2) DEFAULT 0.00,
  total_projects INTEGER DEFAULT 0,
  people_impacted INTEGER DEFAULT 0,
  city_ranking INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reward_rate DECIMAL(4,2) NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium',
  organization VARCHAR(255),
  location VARCHAR(255),
  distance DECIMAL(5,2) DEFAULT 0,
  category VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(8,2) NOT NULL,
  category VARCHAR(100),
  provider VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer sessions table
CREATE TABLE IF NOT EXISTS volunteer_sessions (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES opportunities(id),
  volunteer_id INTEGER REFERENCES users(id),
  hours DECIMAL(6,2) NOT NULL,
  tokens_earned DECIMAL(8,2) NOT NULL,
  description TEXT,
  photo_url VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(50) DEFAULT 'pending_verification',
  verifier_id INTEGER REFERENCES users(id),
  verifier_notes TEXT,
  blockchain_tx_hash VARCHAR(66),
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(10) NOT NULL, -- 'earn' or 'spend'
  amount DECIMAL(8,2) NOT NULL,
  description TEXT,
  volunteer_session_id INTEGER REFERENCES volunteer_sessions(id),
  marketplace_item_id INTEGER REFERENCES marketplace_items(id),
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(active);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON volunteer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Insert sample data
INSERT INTO users (email, password, name, role, balance, total_hours, total_projects, people_impacted, city_ranking) 
VALUES 
  ('admin@cincinnati.gov', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXiXCO9cQZSh7.K', 'Cincinnati Admin', 'municipal_admin', 0, 0, 0, 0, 0),
  ('demo@helptoken.org', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXiXCO9cQZSh7.K', 'Demo User', 'volunteer', 73.5, 73.5, 8, 247, 12)
ON CONFLICT (email) DO NOTHING;

-- Insert sample opportunities
INSERT INTO opportunities (title, description, reward_rate, category, organization, location, distance, priority, created_by)
VALUES 
  ('🏛️ City Hall Deep Clean', 'Municipal facility maintenance project. Help prepare City Hall for community forums.', 2.5, 'Municipal', 'Cincinnati City Government', 'Cincinnati City Hall', 0.8, 'high', 1),
  ('📚 State Exam Tutoring', 'Critical educational support for Cincinnati Public Schools students preparing for Ohio State Tests.', 4.0, 'Education', 'Cincinnati Public Schools', 'Woodward High School', 1.2, 'high', 1),
  ('🌳 Washington Park Maintenance', 'Municipal parks department initiative including trail maintenance and landscaping.', 2.0, 'Parks', 'Cincinnati Parks Department', 'Washington Park', 0.6, 'medium', 1)
ON CONFLICT DO NOTHING;

-- Insert sample marketplace items
INSERT INTO marketplace_items (name, description, cost, category, provider, created_by)
VALUES 
  ('🚌 Metro Weekly Pass', 'Unlimited Cincinnati Metro bus rides for one week', 18, 'Transportation', 'Cincinnati Metro', 1),
  ('🅿️ Downtown Parking Credit', 'Free downtown parking for one full day', 12, 'Transportation', 'City of Cincinnati', 1),
  ('🏊 Recreation Center Pass', 'Week access to city recreation facilities', 15, 'Recreation', 'Cincinnati Parks & Recreation', 1)
ON CONFLICT DO NOTHING; JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        wallet_address: user.wallet_address
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate