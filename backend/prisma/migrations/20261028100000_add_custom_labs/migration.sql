CREATE TABLE "CustomLab" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "safetyNotice" TEXT,
    "safetyNoticeEn" TEXT,
    "equipment" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "vocabulary" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomLab_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomLab_subject_grade_idx" ON "CustomLab"("subject", "grade");
CREATE INDEX "CustomLab_createdById_createdAt_idx" ON "CustomLab"("createdById", "createdAt");

ALTER TABLE "CustomLab"
ADD CONSTRAINT "CustomLab_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
