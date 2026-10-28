ALTER TABLE "Class"
    ADD COLUMN "grade" TEXT NOT NULL DEFAULT '6',
    ADD COLUMN "joinCode" TEXT,
    ADD COLUMN "teacherId" TEXT;

CREATE UNIQUE INDEX "Class_joinCode_key" ON "Class"("joinCode");
CREATE INDEX "Class_teacherId_createdAt_idx" ON "Class"("teacherId", "createdAt");

ALTER TABLE "Class"
    ADD CONSTRAINT "Class_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClassMembership" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassMembership_classId_userId_key"
    ON "ClassMembership"("classId", "userId");
CREATE INDEX "ClassMembership_userId_joinedAt_idx"
    ON "ClassMembership"("userId", "joinedAt");

ALTER TABLE "ClassMembership"
    ADD CONSTRAINT "ClassMembership_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassMembership"
    ADD CONSTRAINT "ClassMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClassCourse" (
    "classId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "ClassCourse_pkey" PRIMARY KEY ("classId", "courseId")
);

CREATE INDEX "ClassCourse_courseId_idx" ON "ClassCourse"("courseId");

ALTER TABLE "ClassCourse"
    ADD CONSTRAINT "ClassCourse_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassCourse"
    ADD CONSTRAINT "ClassCourse_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Flipbook" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectLabelVi" TEXT NOT NULL,
    "subjectLabelEn" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "textbook" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "coverGradient" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "pages" JSONB NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flipbook_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Flipbook_slug_key" ON "Flipbook"("slug");
CREATE INDEX "Flipbook_ownerId_createdAt_idx" ON "Flipbook"("ownerId", "createdAt");
CREATE INDEX "Flipbook_isPublished_createdAt_idx" ON "Flipbook"("isPublished", "createdAt");

ALTER TABLE "Flipbook"
    ADD CONSTRAINT "Flipbook_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grade" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIConversation_userId_updatedAt_idx"
    ON "AIConversation"("userId", "updatedAt");

ALTER TABLE "AIConversation"
    ADD CONSTRAINT "AIConversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIMessage_conversationId_createdAt_idx"
    ON "AIMessage"("conversationId", "createdAt");

ALTER TABLE "AIMessage"
    ADD CONSTRAINT "AIMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
