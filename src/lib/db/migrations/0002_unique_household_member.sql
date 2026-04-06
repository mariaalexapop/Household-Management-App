-- Migration: enforce one row per user per household
--
-- 1. Remove duplicate rows, keeping the admin role over member when both exist,
--    then earliest joined_at as tiebreaker.
-- 2. Add unique constraint so this can never happen again.

DELETE FROM household_members
WHERE id NOT IN (
  SELECT DISTINCT ON (household_id, user_id) id
  FROM household_members
  ORDER BY
    household_id,
    user_id,
    CASE role WHEN 'admin' THEN 0 ELSE 1 END ASC,
    joined_at ASC
);

ALTER TABLE household_members
  ADD CONSTRAINT household_members_household_id_user_id_unique
  UNIQUE (household_id, user_id);
