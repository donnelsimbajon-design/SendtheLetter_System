-- Applied as Supabase migration 'fix_notification_targets_and_social_uniqueness'.
-- Compatible with existing data; no rows are deleted.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "letterId" integer;
UPDATE public.notifications n
SET "letterId" = n."entityId"
WHERE n."letterId" IS NULL
  AND n.type IN ('comment', 'like', 'scheduled_letter_published', 'time_capsule_opened', 'repost')
  AND EXISTS (SELECT 1 FROM public.letters l WHERE l.id = n."entityId");
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS "notifications_entityId_fkey";
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_letterId_fkey') THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT "notifications_letterId_fkey"
      FOREIGN KEY ("letterId") REFERENCES public.letters(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_notifications_letter_id ON public.notifications ("letterId");
CREATE UNIQUE INDEX IF NOT EXISTS follows_unique_pair ON public.follows ("followerId", "followingId");
CREATE UNIQUE INDEX IF NOT EXISTS reposts_unique_pair ON public.reposts ("userId", "letterId");
CREATE UNIQUE INDEX IF NOT EXISTS friends_unique_undirected_pair ON public.friends (LEAST("requesterId", "recipientId"), GREATEST("requesterId", "recipientId"));
