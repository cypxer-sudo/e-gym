-- E-GYM Comprehensive Relational SQL Schema for Cloudflare D1 & SQLite
-- Stores members, rank configurations, rank history, XP ledgers, objectives,
-- check-ins, reading academy logs, workout logs, writing drafts, and dimension radar.

-- 1. Members
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Candidate',
  handle TEXT DEFAULT '@initiate',
  title TEXT DEFAULT 'Initiate',
  current_rank_id TEXT DEFAULT 'recruit',
  tier TEXT DEFAULT 'Explorer',
  bio TEXT,
  avatar TEXT,
  password_hash TEXT,
  is_admin INTEGER DEFAULT 0,
  privacy_mode TEXT DEFAULT 'private', -- private | partners | public
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1b. Member Sessions (Cryptographically signed edge session tokens)
CREATE TABLE IF NOT EXISTS member_sessions (
  token TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
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

-- 4. Ranks Configuration (Configurable Hierarchy & Criteria Engine)
CREATE TABLE IF NOT EXISTS ranks_config (
  id TEXT PRIMARY KEY,
  rank_order INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  emblem_key TEXT NOT NULL,
  min_xp INTEGER NOT NULL DEFAULT 0,
  min_challenges INTEGER NOT NULL DEFAULT 0,
  min_streak INTEGER NOT NULL DEFAULT 0,
  min_checkins INTEGER NOT NULL DEFAULT 0,
  min_objectives INTEGER NOT NULL DEFAULT 0,
  min_dimensions_count INTEGER NOT NULL DEFAULT 0,
  min_dimension_score INTEGER NOT NULL DEFAULT 0,
  special_criteria_desc TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rank Progression History (Audit log of member promotions)
CREATE TABLE IF NOT EXISTS rank_history (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  rank_id TEXT NOT NULL,
  rank_title TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  achieved_xp INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 6. Anti-Tamper XP Activity Ledger (Idempotent, deduplicated transaction log)
CREATE TABLE IF NOT EXISTS xp_ledger (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- objective, checkin, reading, workout, writing, focus, admin
  source_id TEXT NOT NULL,   -- deterministic reference preventing duplicate rewards
  description TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(member_id, source_type, source_id)
);

-- 7. Enrolled Challenges & Protocols
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

-- 8. Daily Check-ins (Evidence & Reflection)
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

-- 9. Today's Objectives (Daily Tasks across Dimensions)
CREATE TABLE IF NOT EXISTS daily_objectives (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  dimension TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- high | medium | low
  time_est TEXT DEFAULT '15m',
  due_time TEXT,
  postponed_count INTEGER DEFAULT 0,
  challenge_id TEXT,
  completed INTEGER DEFAULT 0,
  objective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 9b. Member Onboarding Assessment
CREATE TABLE IF NOT EXISTS member_assessments (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  baseline_radar_json TEXT NOT NULL,
  priority_dimensions TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 9c. Daily Evening Reflections & Discipline Ledger
CREATE TABLE IF NOT EXISTS evening_reflections (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  reflection_date DATE NOT NULL,
  win_summary TEXT NOT NULL,
  friction_summary TEXT NOT NULL,
  tomorrow_target TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 25,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(member_id, reflection_date)
);

-- 9c. Accountability Partnerships
CREATE TABLE IF NOT EXISTS accountability_partnerships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  partner_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | active | ended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 9d. Community Feed & Moderation
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  category TEXT NOT NULL, -- milestone | reading_insight | creative_draft | reflection
  title TEXT,
  content TEXT NOT NULL,
  is_flagged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | reviewed | dismissed | removed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Mind Department: Reading Academy Logs
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

-- 11. Body Department: Workout Logs
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

-- 12. Creation Department: Writing Studio Drafts & Essays
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

-- 13. Performance Record: Earned Achievements & Marks
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 14. Consolidated Fast Edge State Cache Table (For sub-millisecond hydration)
CREATE TABLE IF NOT EXISTS member_state (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_member ON xp_ledger(member_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rank_history_member ON rank_history(member_id, unlocked_at);
CREATE INDEX IF NOT EXISTS idx_objectives_member_date ON daily_objectives(member_id, objective_date);
CREATE INDEX IF NOT EXISTS idx_checkins_member ON check_ins(member_id, challenge_id);
