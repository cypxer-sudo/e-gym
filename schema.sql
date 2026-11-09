-- Cloudflare D1 SQL Schema for E-GYM Platform
-- Run with: npx wrangler d1 execute egym-db --file=./schema.sql

DROP TABLE IF EXISTS member_state;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS reading_logs;
DROP TABLE IF EXISTS workout_logs;
DROP TABLE IF EXISTS writing_drafts;

-- Consolidated Edge Document Store Table for ultra-low latency serverless state
CREATE TABLE IF NOT EXISTS member_state (
  id TEXT PRIMARY KEY DEFAULT 'current_member',
  state_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structured Relational Tables for analytics & multi-user scalability
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  member_id TEXT DEFAULT 'current_member',
  challenge_id TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  note TEXT,
  reflection TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT DEFAULT 'current_member',
  book_title TEXT NOT NULL,
  pages_read INTEGER DEFAULT 0,
  insight TEXT,
  action_item TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT DEFAULT 'current_member',
  exercise_name TEXT NOT NULL,
  sets_detail TEXT,
  rpe INTEGER DEFAULT 8,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS writing_drafts (
  id TEXT PRIMARY KEY,
  member_id TEXT DEFAULT 'current_member',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
