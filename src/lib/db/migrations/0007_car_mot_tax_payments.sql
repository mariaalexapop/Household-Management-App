-- Add MOT and Tax payment details to cars table
ALTER TABLE cars
  ADD COLUMN mot_cost_cents INTEGER,
  ADD COLUMN mot_payment_date TIMESTAMPTZ,
  ADD COLUMN tax_cost_cents INTEGER,
  ADD COLUMN tax_payment_date TIMESTAMPTZ;
