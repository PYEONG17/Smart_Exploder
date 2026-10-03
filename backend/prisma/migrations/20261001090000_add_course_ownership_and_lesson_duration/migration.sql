ALTER TABLE "Course"
ADD COLUMN "createdById" TEXT;

ALTER TABLE "Lesson"
ADD COLUMN "duration" TEXT;

CREATE INDEX "Course_createdById_idx" ON "Course"("createdById");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
