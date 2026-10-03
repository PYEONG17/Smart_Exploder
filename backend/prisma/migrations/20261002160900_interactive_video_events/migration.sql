ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DRAG_DROP';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'MATCHING';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'FILL_BLANK';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'POLL';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'REFLECTION';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'VOCABULARY';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'AI_EXPLANATION';

ALTER TABLE "InteractiveActivity"
ADD COLUMN "timestamp_ms" INTEGER;

UPDATE "InteractiveActivity"
SET "timestamp_ms" = "timestamp" * 1000
WHERE "timestamp_ms" IS NULL;

ALTER TABLE "InteractiveActivity"
ALTER COLUMN "timestamp_ms" SET NOT NULL;

ALTER TABLE "InteractiveActivity"
ADD CONSTRAINT "InteractiveActivity_timestamp_ms_nonnegative"
CHECK ("timestamp_ms" >= 0);

CREATE INDEX "InteractiveActivity_videoId_timestamp_ms_idx"
ON "InteractiveActivity"("videoId", "timestamp_ms");

CREATE TABLE "InteractiveResponse" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "client_event_id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "is_correct" BOOLEAN,
    "score" DOUBLE PRECISION,
    "duration_ms" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InteractiveResponse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InteractiveResponse_duration_ms_check" CHECK ("duration_ms" >= 0)
);

CREATE UNIQUE INDEX "InteractiveResponse_user_id_client_event_id_key"
ON "InteractiveResponse"("user_id", "client_event_id");
CREATE INDEX "InteractiveResponse_activity_id_submitted_at_idx"
ON "InteractiveResponse"("activity_id", "submitted_at");
CREATE INDEX "InteractiveResponse_user_id_submitted_at_idx"
ON "InteractiveResponse"("user_id", "submitted_at");

ALTER TABLE "InteractiveResponse"
ADD CONSTRAINT "InteractiveResponse_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InteractiveResponse"
ADD CONSTRAINT "InteractiveResponse_activity_id_fkey"
FOREIGN KEY ("activity_id") REFERENCES "InteractiveActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
