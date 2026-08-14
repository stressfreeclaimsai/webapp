-- Customer-validated access model: two levels only. Existing pre-pilot
-- reviewer/manager records collapse into the conservative standard role.
UPDATE "StaffUser"
SET "role" = 'standard'
WHERE "role" IN ('reviewer', 'manager');

ALTER TABLE "StaffUser"
ALTER COLUMN "role" SET DEFAULT 'standard';
