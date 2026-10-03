-- Videos in a lesson can be reordered by teachers.
ALTER TABLE "Video" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Keep the existing display order (creation time) as the initial order.
UPDATE "Video" AS v
SET "order" = ranked.position
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "lessonId" ORDER BY "createdAt", "id") AS position
  FROM "Video"
) AS ranked
WHERE v."id" = ranked."id";

CREATE INDEX "Video_lessonId_order_idx" ON "Video"("lessonId", "order");
