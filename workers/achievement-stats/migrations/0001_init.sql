-- Anonymous stats for the 52Hz Logbook and Ajie's post likes.
-- visitor_hash = SHA-256 (hex) of the browser's random installation secret; nothing else is stored.
-- Times are UTC Unix milliseconds.

CREATE TABLE visitors (
  visitor_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE visitor_achievements (
  visitor_hash TEXT NOT NULL REFERENCES visitors(visitor_hash),
  achievement_id TEXT NOT NULL,
  reported_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_hash, achievement_id)
);

CREATE INDEX idx_visitor_achievements_id ON visitor_achievements(achievement_id);

-- One like per visitor per post; post_id first so counting a post uses the primary key.
CREATE TABLE ajie_likes (
  post_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL REFERENCES visitors(visitor_hash),
  liked_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, visitor_hash)
);
