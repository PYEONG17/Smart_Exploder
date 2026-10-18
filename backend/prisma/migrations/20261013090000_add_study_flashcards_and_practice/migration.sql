CREATE TABLE "StudyFlashcard" (
    "id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "tag" VARCHAR(100) NOT NULL,
    "difficulty" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyFlashcard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "correctAnswerIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "topic" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeAnswerAttempt" (
    "id" TEXT NOT NULL,
    "selectedAnswerIndex" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAnswerAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyFlashcard_userId_createdAt_idx"
ON "StudyFlashcard"("userId", "createdAt");
CREATE INDEX "PracticeQuestion_userId_createdAt_idx"
ON "PracticeQuestion"("userId", "createdAt");
CREATE INDEX "PracticeAnswerAttempt_userId_createdAt_idx"
ON "PracticeAnswerAttempt"("userId", "createdAt");
CREATE INDEX "PracticeAnswerAttempt_questionId_createdAt_idx"
ON "PracticeAnswerAttempt"("questionId", "createdAt");

ALTER TABLE "StudyFlashcard"
ADD CONSTRAINT "StudyFlashcard_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeQuestion"
ADD CONSTRAINT "PracticeQuestion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeAnswerAttempt"
ADD CONSTRAINT "PracticeAnswerAttempt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeAnswerAttempt"
ADD CONSTRAINT "PracticeAnswerAttempt_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
