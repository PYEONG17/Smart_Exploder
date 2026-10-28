import prisma from "../../config/db.js";
import { INITIAL_EXPLORE_MATERIALS } from "./data.js";

/**
 * Seed or Sync all 20+ Explore materials into Neon PostgreSQL
 */
export async function seedExploreMaterials() {
  console.log("🌱 Starting Explore Materials DB sync...");
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of INITIAL_EXPLORE_MATERIALS) {
    try {
      const existing = await prisma.exploreMaterial.findFirst({
        where: {
          OR: [{ id: item.id }, { slug: item.slug }],
        },
      });

      if (!existing) {
        await prisma.exploreMaterial.create({
          data: {
            id: item.id,
            slug: item.slug,
            title: item.title,
            titleEn: item.titleEn,
            description: item.description,
            descriptionEn: item.descriptionEn,
            category: item.category,
            categoryLabelVi: item.categoryLabelVi,
            categoryLabelEn: item.categoryLabelEn,
            grade: item.grade,
            subject: item.subject,
            subjectLabelVi: item.subjectLabelVi,
            subjectLabelEn: item.subjectLabelEn,
            type: item.type,
            typeLabelVi: item.typeLabelVi,
            typeLabelEn: item.typeLabelEn,
            modelType: item.modelType,
            thumbnailUrl: item.thumbnailUrl,
            curriculum: item.curriculum,
            textbook: item.textbook,
            viewsCount: item.viewsCount || 0,
            rating: item.rating || 5.0,
            tags: item.tags || [],
            bilingualTerms: item.bilingualTerms as any,
            autoTourStops: item.autoTourStops as any,
            miniQuiz: item.miniQuiz as any,
            aiPromptContext: item.aiPromptContext || "",
            relatedCourseId: item.relatedCourseId,
            relatedLessonId: item.relatedLessonId,
            isPublished: true,
          },
        });
        createdCount++;
      } else {
        await prisma.exploreMaterial.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            titleEn: item.titleEn,
            description: item.description,
            descriptionEn: item.descriptionEn,
            category: item.category,
            categoryLabelVi: item.categoryLabelVi,
            categoryLabelEn: item.categoryLabelEn,
            grade: item.grade,
            subject: item.subject,
            subjectLabelVi: item.subjectLabelVi,
            subjectLabelEn: item.subjectLabelEn,
            type: item.type,
            typeLabelVi: item.typeLabelVi,
            typeLabelEn: item.typeLabelEn,
            modelType: item.modelType,
            thumbnailUrl: item.thumbnailUrl,
            curriculum: item.curriculum,
            textbook: item.textbook,
            tags: item.tags || [],
            bilingualTerms: item.bilingualTerms as any,
            autoTourStops: item.autoTourStops as any,
            miniQuiz: item.miniQuiz as any,
            aiPromptContext: item.aiPromptContext || "",
          },
        });
        updatedCount++;
      }
    } catch (err) {
      console.error(`❌ Failed to sync item ${item.slug}:`, err);
    }
  }

  const total = await prisma.exploreMaterial.count();
  console.log(`✅ Explore Materials DB sync complete! Created: ${createdCount}, Updated: ${updatedCount}, Total in DB: ${total}`);
  return { createdCount, updatedCount, total };
}

// Allow standalone execution: node seed.ts
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedExploreMaterials()
    .catch((err) => console.error("Seed error:", err))
    .finally(() => prisma.$disconnect());
}
