CREATE TABLE "explore_materials" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryLabelVi" TEXT NOT NULL DEFAULT 'Khoa học tự nhiên K12',
    "categoryLabelEn" TEXT NOT NULL DEFAULT 'Natural Science K12',
    "grade" TEXT NOT NULL DEFAULT 'all',
    "subject" TEXT NOT NULL DEFAULT 'science',
    "subjectLabelVi" TEXT NOT NULL DEFAULT 'Khoa học',
    "subjectLabelEn" TEXT NOT NULL DEFAULT 'Science',
    "type" TEXT NOT NULL DEFAULT '3d_model',
    "typeLabelVi" TEXT NOT NULL DEFAULT 'Mô hình 3D',
    "typeLabelEn" TEXT NOT NULL DEFAULT '3D Model',
    "modelType" TEXT NOT NULL DEFAULT 'sphere',
    "thumbnailUrl" TEXT,
    "curriculum" TEXT NOT NULL DEFAULT 'GDPT 2018',
    "textbook" TEXT NOT NULL DEFAULT 'Kết Nối Tri Thức',
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "bilingualTerms" JSONB NOT NULL DEFAULT '[]',
    "autoTourStops" JSONB NOT NULL DEFAULT '[]',
    "miniQuiz" JSONB NOT NULL DEFAULT '[]',
    "aiPromptContext" TEXT,
    "relatedCourseId" TEXT,
    "relatedLessonId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "explore_materials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "explore_materials_slug_key"
    ON "explore_materials"("slug");
CREATE INDEX "explore_materials_category_idx"
    ON "explore_materials"("category");
CREATE INDEX "explore_materials_grade_idx"
    ON "explore_materials"("grade");
CREATE INDEX "explore_materials_subject_idx"
    ON "explore_materials"("subject");
CREATE INDEX "explore_materials_type_idx"
    ON "explore_materials"("type");
