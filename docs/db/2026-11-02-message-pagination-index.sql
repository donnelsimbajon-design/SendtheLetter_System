-- Covers both directions of a private conversation and cursor ordering.
-- Non-destructive; existing message records are preserved.
CREATE INDEX IF NOT EXISTS idx_messages_thread_cursor
  ON public.messages ("senderId", "receiverId", id DESC);
