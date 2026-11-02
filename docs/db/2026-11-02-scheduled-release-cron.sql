-- Database-driven release of scheduled letters and time capsules.
-- This runs even when the Render API process is asleep. No existing records are deleted.
-- All release and notification updates are atomic and idempotent.
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.release_due_letters_once()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $release$
DECLARE
    released_count integer := 0;
BEGIN
    WITH released AS (
        UPDATE public.letters AS l
        SET status = 'published', "updatedAt" = now()
        WHERE l.status = 'scheduled'
          AND l."isArchived" IS NOT TRUE
          AND (
              (l."isTimeCapsule" IS TRUE AND l."openDate" <= now()) OR
              (l."isTimeCapsule" IS NOT TRUE AND l."scheduledDate" <= now())
          )
        RETURNING l.id, l."userId", l."isTimeCapsule"
    )
    INSERT INTO public.notifications (
        "userId", "actorId", type, "entityId", "letterId",
        "isRead", "createdAt", "updatedAt"
    )
    SELECT
        "userId", "userId",
        CASE WHEN "isTimeCapsule" IS TRUE THEN 'time_capsule_opened' ELSE 'scheduled_letter_published' END,
        id, id, false, now(), now()
    FROM released;

    GET DIAGNOSTICS released_count = ROW_COUNT;
    RETURN released_count;
END;
$release$;

REVOKE ALL ON FUNCTION public.release_due_letters_once() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule(
    'sendtheletter-release-due-letters',
    '* * * * *',
    'SELECT public.release_due_letters_once()'
);
