ALTER TABLE "Quiz"
ADD COLUMN "videoId" TEXT;

CREATE INDEX "Quiz_videoId_idx" ON "Quiz"("videoId");

ALTER TABLE "Quiz"
ADD CONSTRAINT "Quiz_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
