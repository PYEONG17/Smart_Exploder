CREATE TABLE "LessonQuestion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionLanguage" VARCHAR(2) NOT NULL DEFAULT 'vi',
    "questionTranslated" TEXT NOT NULL,
    "answer" TEXT,
    "answerLanguage" VARCHAR(2),
    "answerTranslated" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonQuestion_lessonId_createdAt_idx"
ON "LessonQuestion"("lessonId", "createdAt");
CREATE INDEX "LessonQuestion_authorId_createdAt_idx"
ON "LessonQuestion"("authorId", "createdAt");
CREATE INDEX "LessonQuestion_answeredById_answeredAt_idx"
ON "LessonQuestion"("answeredById", "answeredAt");

ALTER TABLE "LessonQuestion"
ADD CONSTRAINT "LessonQuestion_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonQuestion"
ADD CONSTRAINT "LessonQuestion_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonQuestion"
ADD CONSTRAINT "LessonQuestion_answeredById_fkey"
FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
