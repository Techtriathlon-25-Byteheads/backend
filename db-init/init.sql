-- This script will be executed when the PostgreSQL container is first created.
-- It seeds the database with a default super admin user.

-- Note: This assumes the DimUsers table has been created by Prisma migrations first.
-- The official postgres image runs scripts in /docker-entrypoint-initdb.d AFTER init.
-- However, to be safe, we can wrap this in a transaction or check for table existence if needed.

-- The password is 'superadminpassword', bcrypted with 10 salt rounds.
INSERT INTO "DimUsers" ("userId", "email", "passwordHash", "role", "isVerified", "isActive") VALUES
('USR-SUPERADMIN-001', 'superadmin@gov.lk', '$2b$10$XnUpDrTRZD5lUuPxdLpSBu9nIhd0GG1a2hzxucmg.JfGP9rrvkht.', 'SUPER_ADMIN', true, true);
