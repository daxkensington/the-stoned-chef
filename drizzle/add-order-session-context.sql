-- Persist checkout request snapshot (IP / UA / geo) for fraud investigation.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address varchar(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_agent varchar(512);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_context text;
