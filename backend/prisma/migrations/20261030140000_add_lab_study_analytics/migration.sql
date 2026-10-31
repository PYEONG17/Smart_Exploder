CREATE TABLE "lab_study_events" (
    "id" TEXT NOT NULL,
    "client_event_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "position_ms" INTEGER NOT NULL,
    "studied_ms" INTEGER NOT NULL DEFAULT 0,
    "client_occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "tenant_id" UUID,

    CONSTRAINT "lab_study_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_study_events_position_ms_check" CHECK ("position_ms" >= 0),
    CONSTRAINT "lab_study_events_studied_ms_check" CHECK ("studied_ms" >= 0 AND "studied_ms" <= 30000)
);

CREATE UNIQUE INDEX "lab_study_events_client_event_id_key"
    ON "lab_study_events"("client_event_id");
CREATE INDEX "lab_study_events_user_id_created_at_idx"
    ON "lab_study_events"("user_id", "created_at");
CREATE INDEX "lab_study_events_user_id_session_id_client_occurred_at_idx"
    ON "lab_study_events"("user_id", "session_id", "client_occurred_at");
CREATE INDEX "lab_study_events_lab_id_created_at_idx"
    ON "lab_study_events"("lab_id", "created_at");
CREATE INDEX "lab_study_events_tenant_id_created_at_idx"
    ON "lab_study_events"("tenant_id", "created_at");

ALTER TABLE "lab_study_events"
    ADD CONSTRAINT "lab_study_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_study_events"
    ADD CONSTRAINT "lab_study_events_lab_id_fkey"
    FOREIGN KEY ("lab_id") REFERENCES "CustomLab"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_study_events"
    ADD CONSTRAINT "lab_study_events_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
