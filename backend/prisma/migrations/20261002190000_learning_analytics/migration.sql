CREATE TABLE "video_watch_events" (
    "id" TEXT NOT NULL,
    "client_event_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "position_ms" INTEGER NOT NULL,
    "watched_ms" INTEGER NOT NULL DEFAULT 0,
    "client_occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "tenant_id" UUID,

    CONSTRAINT "video_watch_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "video_watch_events_position_ms_check" CHECK ("position_ms" >= 0),
    CONSTRAINT "video_watch_events_watched_ms_check" CHECK ("watched_ms" >= 0 AND "watched_ms" <= 30000)
);

CREATE UNIQUE INDEX "video_watch_events_client_event_id_key"
    ON "video_watch_events"("client_event_id");
CREATE INDEX "video_watch_events_user_id_created_at_idx"
    ON "video_watch_events"("user_id", "created_at");
CREATE INDEX "video_watch_events_user_id_session_id_client_occurred_at_idx"
    ON "video_watch_events"("user_id", "session_id", "client_occurred_at");
CREATE INDEX "video_watch_events_video_id_created_at_idx"
    ON "video_watch_events"("video_id", "created_at");
CREATE INDEX "video_watch_events_tenant_id_created_at_idx"
    ON "video_watch_events"("tenant_id", "created_at");

ALTER TABLE "video_watch_events"
    ADD CONSTRAINT "video_watch_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_watch_events"
    ADD CONSTRAINT "video_watch_events_video_id_fkey"
    FOREIGN KEY ("video_id") REFERENCES "Video"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_watch_events"
    ADD CONSTRAINT "video_watch_events_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
