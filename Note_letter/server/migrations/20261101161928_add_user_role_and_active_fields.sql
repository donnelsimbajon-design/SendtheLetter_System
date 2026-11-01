-- Adds the authentication fields required by the Sequelize User model.
-- Safe for existing rows: existing users receive the default role and active state.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
