/*
  # Create miniapp database schema

  1. New Tables
    - `users` - Store user data and balances
    - `daily_claims` - Track daily reward claims
    - `tasks` - Define available tasks
    - `user_tasks` - Track completed tasks per user
    - `referrals` - Track referral relationships
    - `withdrawals` - Store withdrawal requests
    - `transactions` - Track all balance changes

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  balance DECIMAL(10,6) DEFAULT 0,
  total_earned DECIMAL(10,6) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily claims tracking
CREATE TABLE IF NOT EXISTS daily_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  claim_date DATE DEFAULT CURRENT_DATE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 9),
  amount DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, claim_date)
);

-- Tasks definition
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ads', 'follow', 'partner')),
  title TEXT NOT NULL,
  description TEXT,
  reward DECIMAL(10,6) NOT NULL,
  url TEXT NOT NULL,
  icon_bg TEXT DEFAULT '#0B1530',
  icon_color TEXT DEFAULT '#fff',
  max_completions INTEGER, -- NULL = unlimited, number = max times
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User task completions
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  reward_amount DECIMAL(10,6) NOT NULL,
  session_data JSONB, -- for ads tracking
  UNIQUE(user_id, task_id) -- for one-time tasks
);

-- Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  referred_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id) -- each user can only be referred once
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,6) NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

-- Transaction history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily_claim', 'task_reward', 'referral_bonus', 'withdrawal')),
  amount DECIMAL(10,6) NOT NULL,
  description TEXT,
  reference_id UUID, -- links to daily_claims, user_tasks, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (id = auth.uid()::bigint);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (id = auth.uid()::bigint);

CREATE POLICY "Users can read own claims" ON daily_claims FOR SELECT USING (user_id = auth.uid()::bigint);
CREATE POLICY "Users can insert own claims" ON daily_claims FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Anyone can read active tasks" ON tasks FOR SELECT USING (is_active = true);

CREATE POLICY "Users can read own task completions" ON user_tasks FOR SELECT USING (user_id = auth.uid()::bigint);
CREATE POLICY "Users can insert own task completions" ON user_tasks FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid()::bigint OR referred_id = auth.uid()::bigint);
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own withdrawals" ON withdrawals FOR SELECT USING (user_id = auth.uid()::bigint);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (user_id = auth.uid()::bigint);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

-- Insert default tasks
INSERT INTO tasks (type, title, description, reward, url, icon_bg, max_completions) VALUES
-- Ads tasks (unlimited)
('ads', 'Watch Ad #1', 'Complete advertisement task', 0.002, 'https://otieu.com/4/9907519', '#0B1530', NULL),
('ads', 'Watch Ad #2', 'Complete advertisement task', 0.002, 'https://otieu.com/4/9907513', '#0B1530', NULL),

-- Follow tasks (one-time)
('follow', 'Follow Twitter', 'Follow our Twitter account', 0.005, 'https://otieu.com/4/9907519', '#0B0B0B', 1),

-- Partner tasks (one-time)
('partner', 'Join Binance', 'Register on Binance exchange', 0.01, 'https://accounts.bmwweb.biz/register?ref=535958866', '#F3BA2F', 1),
('partner', 'Join KuCoin', 'Register on KuCoin exchange', 0.01, 'https://www.kucoin.com/r/rf/QBSTDC9A', '#24AE8F', 1),
('partner', 'Follow TikTok', 'Follow our TikTok account', 0.005, 'https://vt.tiktok.com/ZSHn3Hvmpk6a8-IMDAm/', '#FF0050', 1),
('partner', 'Join Telegram Channel', 'Join our partner Telegram channel', 0.005, 'https://t.me/instanmoneyairdrop', '#229ED9', 1);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_date ON daily_claims(user_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_task ON user_tasks(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'REF' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id BIGINT,
  p_amount DECIMAL(10,6),
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update user balance
  UPDATE users 
  SET 
    balance = balance + p_amount,
    total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, p_type, p_amount, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql;