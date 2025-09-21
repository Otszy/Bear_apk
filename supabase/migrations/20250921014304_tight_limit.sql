/*
  # Complete Miniapp Database Schema

  1. New Tables
    - `users` - Store user profiles with balance and referral data
    - `daily_claims` - Track daily reward claims (once per day limit)
    - `tasks` - Configurable tasks with different types and limits
    - `user_tasks` - Track user task completions
    - `referrals` - Track referral relationships
    - `withdrawals` - Store withdrawal requests
    - `transactions` - Complete transaction history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access patterns

  3. Functions
    - Balance update function with transaction logging
    - Referral bonus distribution
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  balance DECIMAL(20,8) DEFAULT 0,
  total_earned DECIMAL(20,8) DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily claims table
CREATE TABLE IF NOT EXISTS daily_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 9),
  amount DECIMAL(20,8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, claim_date)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ads', 'follow', 'partner')),
  url TEXT NOT NULL,
  reward DECIMAL(20,8) NOT NULL,
  max_completions INTEGER DEFAULT 1,
  icon_bg TEXT DEFAULT '#C6FF3E',
  icon_color TEXT DEFAULT '#0C0F14',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reward_amount DECIMAL(20,8) NOT NULL,
  session_data JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily_claim', 'task_reward', 'referral_bonus', 'withdrawal')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can read own daily claims" ON daily_claims
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can create own daily claims" ON daily_claims
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Anyone can read active tasks" ON tasks
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own task completions" ON user_tasks
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can create own task completions" ON user_tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT TO authenticated
  USING (referrer_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint 
         OR referred_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can create own withdrawals" ON withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::bigint);

-- Function to update user balance with transaction logging
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id BIGINT,
  p_amount DECIMAL(20,8),
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update user balance
  UPDATE users 
  SET 
    balance = balance + p_amount,
    total_earned = CASE 
      WHEN p_amount > 0 THEN total_earned + p_amount 
      ELSE total_earned 
    END,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial tasks
INSERT INTO tasks (title, description, type, url, reward, max_completions, icon_bg, icon_color) VALUES
-- Ads tasks (unlimited)
('Watch Ad #1', 'Watch advertisement and earn rewards', 'ads', 'https://otieu.com/4/9907519', 0.002, 999999, '#FF6B6B', '#FFFFFF'),
('Watch Ad #2', 'Watch advertisement and earn rewards', 'ads', 'https://otieu.com/4/9907513', 0.002, 999999, '#4ECDC4', '#FFFFFF'),

-- Follow tasks (one-time)
('Follow on Twitter', 'Follow our Twitter account', 'follow', 'https://otieu.com/4/9907519', 0.005, 1, '#1DA1F2', '#FFFFFF'),

-- Partner tasks (one-time)
('Join Binance', 'Register on Binance exchange', 'partner', 'https://accounts.bmwweb.biz/register?ref=535958866', 0.01, 1, '#F3BA2F', '#000000'),
('Join KuCoin', 'Register on KuCoin exchange', 'partner', 'https://www.kucoin.com/r/rf/QBSTDC9A', 0.01, 1, '#24AE8F', '#FFFFFF'),
('Follow TikTok', 'Follow our TikTok account', 'partner', 'https://vt.tiktok.com/ZSHn3Hvmpk6a8-IMDAm/', 0.008, 1, '#000000', '#FFFFFF'),
('Join Telegram Channel', 'Join our partner Telegram channel', 'partner', 'https://t.me/instanmoneyairdrop', 0.006, 1, '#0088CC', '#FFFFFF')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_date ON daily_claims(user_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_task ON user_tasks(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);