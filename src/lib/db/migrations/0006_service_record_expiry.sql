-- Add expiry_date column to service_records for MOT/ITP and Road Tax tracking
ALTER TABLE service_records
  ADD COLUMN expiry_date TIMESTAMPTZ;
