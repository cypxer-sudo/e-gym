-- E-GYM Comprehensive Relational SQL Schema for Cloudflare D1 & SQLite
-- Stores all member profiles, daily objectives, check-ins, reading academy logs,
-- workout logs, writing drafts, dimensions radar, and achievements.

-- 1. Members
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Candidate',
  handle TEXT DEFAULT '@initiate',
  title TEXT DEFAULT 'Initiate',
  tier TEXT DEFAULT 'Explorer',
  bio TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Member Performance Stats
CREATE TABLE IF NOT EXISTS member_stats (
  member_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 0,
  total_objectives_done INTEGER DEFAULT 0,
  hours_invested INTEGER DEFAULT 0,
  unreal_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 3. 8-Dimension Radar Balance (0 - 100%)
CREATE TABLE IF NOT EXISTS member_radar (
  member_id TEXT PRIMARY KEY,
  physical INTEGER DEFAULT 50,
  intellectual INTEGER DEFAULT 50,
  emotional INTEGER DEFAULT 50,
  psychological INTEGER DEFAULT 50,
  social INTEGER DEFAULT 50,
  financial INTEGER DEFAULT 50,
  professional INTEGER DEFAULT 50,
  creative INTEGER DEFAULT 50,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 4. Enrolled Challenges & Protocols
CREATE TABLE IF NOT EXISTS enrolled_challenges (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  current_day INTEGER DEFAULT 1,
  started_at DATE NOT NULL,
  status TEXT DEFAULT 'active', -- active | completed | abandoned
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 5. Daily Check-ins (Evidence & Reflection)
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  note TEXT,
  reflection TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 6. Today's Objectives (Daily Tasks across Dimensions)
CREATE TABLE IF NOT EXISTS daily_objectives (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  dimension TEXT NOT NULL, -- physical, intellectual, execution, etc.
  time_est TEXT DEFAULT '15m',
  challenge_id TEXT,
  completed INTEGER DEFAULT 0, -- 0 for false, 1 for true
  objective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 7. Mind Department: Reading Academy Logs
CREATE TABLE IF NOT EXISTS reading_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  book_title TEXT NOT NULL,
  author TEXT,
  pages_read INTEGER DEFAULT 0,
  insight TEXT NOT NULL,
  action_item TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 8. Body Department: Workout Logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_detail TEXT,
  rpe INTEGER DEFAULT 8,
  notes TEXT,
  workout_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 9. Creation Department: Writing Studio Drafts & Essays
CREATE TABLE IF NOT EXISTS writing_drafts (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 10. Performance Record: Earned Achievements & Marks
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 11. Consolidated Fast Edge State Cache Table (For ultra-low latency JSON hydration)
CREATE TABLE IF NOT EXISTS member_state (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_objectives_member_date ON daily_objectives(member_id, objective_date);
CREATE INDEX IF NOT EXISTS idx_checkins_member ON check_ins(member_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_reading_member ON reading_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_workout_member ON workout_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_writing_member ON writing_drafts(member_id);
