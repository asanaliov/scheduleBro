ALTER TABLE bookings
ADD COLUMN service_id TEXT NOT NULL DEFAULT 'haircut'
CHECK (service_id IN ('haircut', 'beard-trim', 'haircut-beard'));

ALTER TABLE bookings
ADD COLUMN service_duration_minutes INTEGER NOT NULL DEFAULT 30
CHECK (service_duration_minutes BETWEEN 15 AND 240);

ALTER TABLE bookings
ADD COLUMN price_mkd INTEGER NOT NULL DEFAULT 900
CHECK (price_mkd >= 0);

CREATE INDEX bookings_service_id_idx ON bookings (service_id);

CREATE TRIGGER prevent_service_overrun
BEFORE INSERT ON bookings
WHEN NEW.service_duration_minutes > (
  SELECT duration_minutes FROM slots WHERE id = NEW.slot_id
)
BEGIN
  SELECT RAISE(ABORT, 'service_exceeds_slot');
END;
