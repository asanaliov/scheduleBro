CREATE TABLE slots (
  id TEXT PRIMARY KEY NOT NULL,
  start_at_ms INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX slots_start_at_ms_idx ON slots (start_at_ms);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  slot_id TEXT NOT NULL UNIQUE,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (slot_id) REFERENCES slots (id) ON DELETE RESTRICT
);

CREATE TRIGGER prevent_overlapping_slots
BEFORE INSERT ON slots
WHEN EXISTS (
  SELECT 1
  FROM slots AS existing
  WHERE NEW.start_at_ms < existing.start_at_ms + existing.duration_minutes * 60000
    AND NEW.start_at_ms + NEW.duration_minutes * 60000 > existing.start_at_ms
)
BEGIN
  SELECT RAISE(ABORT, 'slot_overlap');
END;
