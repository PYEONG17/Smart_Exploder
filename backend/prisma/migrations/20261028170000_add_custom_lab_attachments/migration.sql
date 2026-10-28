ALTER TABLE "CustomLab"
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;
