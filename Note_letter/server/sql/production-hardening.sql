-- Production hardening applied to Supabase project virleqhvsljiidurprvq.
-- Reviewed against the app's current architecture:
--   - The browser talks to the Express API, not directly to Supabase tables.
--   - The Express API uses the server-only PostgreSQL connection.
--   - The connected database role was verified as postgres (BYPASSRLS).
-- Keep browser roles from accessing application tables directly. The API server
-- remains responsible for authorization using the application's JWT middleware.

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.users, public.letters, public.notifications, public.follows,
  public.messages, public.friends, public.comments, public.likes, public.reposts
FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Keep one UNIQUE constraint per natural key; remove redundant duplicates
-- created by repeated automatic Sequelize schema alteration.
DO $$
DECLARE n integer;
BEGIN
  FOR n IN 1..20 LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', 'users_email_key' || n);
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', 'users_username_key' || n);
  END LOOP;
END $$;

-- Cover the existing foreign keys to avoid expensive parent-row checks/joins.
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON public.letters ("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications ("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications ("actorId");
CREATE INDEX IF NOT EXISTS idx_notifications_entity_id ON public.notifications ("entityId");
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows ("followerId");
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows ("followingId");
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages ("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages ("receiverId");
CREATE INDEX IF NOT EXISTS idx_friends_requester_id ON public.friends ("requesterId");
CREATE INDEX IF NOT EXISTS idx_friends_recipient_id ON public.friends ("recipientId");
CREATE INDEX IF NOT EXISTS idx_comments_letter_id ON public.comments ("letterId");
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments ("userId");
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes ("userId");
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts ("userId");
CREATE INDEX IF NOT EXISTS idx_reposts_letter_id ON public.reposts ("letterId");

COMMIT;
