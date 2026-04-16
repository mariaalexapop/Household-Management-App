-- Add covered entity columns to insurance_policies
ALTER TABLE insurance_policies
  ADD COLUMN covered_name TEXT,
  ADD COLUMN linked_car_id UUID REFERENCES cars(id) ON DELETE SET NULL;
