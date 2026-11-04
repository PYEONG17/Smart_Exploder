CREATE TYPE "VideoContentType" AS ENUM ('VIDEO', 'H5P');

ALTER TABLE "Video"
ADD COLUMN "contentType" "VideoContentType" NOT NULL DEFAULT 'VIDEO';

ALTER TABLE "LessonQuestion"
ADD COLUMN "videoId" TEXT,
ADD COLUMN "timestampSeconds" INTEGER;

CREATE INDEX "LessonQuestion_videoId_timestampSeconds_idx"
ON "LessonQuestion"("videoId", "timestampSeconds");

ALTER TABLE "LessonQuestion"
ADD CONSTRAINT "LessonQuestion_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VideoStudyMarker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "note" TEXT,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoStudyMarker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VideoStudyMarker_userId_videoId_timestampSeconds_key"
ON "VideoStudyMarker"("userId", "videoId", "timestampSeconds");
CREATE INDEX "VideoStudyMarker_userId_updatedAt_idx"
ON "VideoStudyMarker"("userId", "updatedAt");
CREATE INDEX "VideoStudyMarker_videoId_timestampSeconds_idx"
ON "VideoStudyMarker"("videoId", "timestampSeconds");

ALTER TABLE "VideoStudyMarker"
ADD CONSTRAINT "VideoStudyMarker_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VideoStudyMarker"
ADD CONSTRAINT "VideoStudyMarker_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
