import { Request, Response } from "express";
import prisma from "../../config/db.js";
import { seedExploreMaterials } from "./seed.js";

/**
 * Helper: ensure DB has initial data on first request
 */
async function ensureDbSeeded() {
  try {
    const count = await prisma.exploreMaterial.count();
    if (count === 0) {
      console.log("No explore materials found in DB. Auto-seeding initial materials...");
      await seedExploreMaterials();
    }
  } catch (err) {
    console.error("Error checking or auto-seeding DB:", err);
  }
}

/**
 * GET /api/explore
 * Query params:
 * - category: string
 * - grade: string
 * - subject: string
 * - type: string
 * - search: keyword
 * - textbook: string
 * - sortBy: "popular" | "rating" | "newest"
 */
export async function listExploreMaterials(req: Request, res: Response) {
  try {
    await ensureDbSeeded();

    const {
      category = "all",
      grade = "all",
      subject = "all",
      type = "all",
      search = "",
      textbook = "all",
      sortBy = "popular",
    } = req.query as Record<string, string>;

    const where: any = {
      isPublished: true,
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (grade && grade !== "all") {
      where.OR = [{ grade }, { grade: "all" }];
    }

    if (subject && subject !== "all") {
      where.subject = subject;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (textbook && textbook !== "all") {
      const textbookNames: Record<string, string> = {
        ket_noi: "Kết Nối Tri Thức",
        canh_dieu: "Cánh Diều",
        chan_troi: "Chân Trời Sáng Tạo",
      };
      where.textbook = {
        contains: textbookNames[textbook] || textbook,
        mode: "insensitive",
      };
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { titleEn: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        },
      ];
    }

    let orderBy: any = { viewsCount: "desc" };
    if (sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const materials = await prisma.exploreMaterial.findMany({
      where,
      orderBy,
    });

    return res.status(200).json({
      success: true,
      total: materials.length,
      data: materials,
      source: "database",
    });
  } catch (error) {
    console.error("Error in listExploreMaterials:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải học liệu từ cơ sở dữ liệu",
    });
  }
}

/**
 * GET /api/explore/filters
 * Returns counts and available filter options for dynamic UI facets
 */
export async function getExploreFilters(_req: Request, res: Response) {
  try {
    await ensureDbSeeded();

    const totalMaterials = await prisma.exploreMaterial.count({
      where: { isPublished: true },
    });

    const categories = [
      { id: "all", labelVi: "Tất cả học liệu", labelEn: "All Materials" },
      { id: "natural_science", labelVi: "Khoa học tự nhiên K12", labelEn: "Natural Science K12" },
      { id: "social_science", labelVi: "Khoa học xã hội & Văn hóa", labelEn: "Social Science & Culture" },
      { id: "teaching_support", labelVi: "Cảnh 3D theo bài học", labelEn: "3D Lesson Scenes" },
      { id: "virtual_lab", labelVi: "Kho thí nghiệm ảo K12", labelEn: "Virtual Simulation Lab" },
      { id: "sandbox", labelVi: "Sandbox & STEM 3D", labelEn: "Sandbox & STEM 3D" },
      { id: "question_bank", labelVi: "Ngân hàng câu hỏi K12", labelEn: "Question Bank K12" },
    ];

    const grades = [
      { id: "all", labelVi: "Tất cả các khối lớp", labelEn: "All Grades" },
      { id: "6", labelVi: "Lớp 6", labelEn: "Grade 6" },
      { id: "7", labelVi: "Lớp 7", labelEn: "Grade 7" },
      { id: "8", labelVi: "Lớp 8", labelEn: "Grade 8" },
      { id: "9", labelVi: "Lớp 9", labelEn: "Grade 9" },
    ];

    const subjects = [
      { id: "all", labelVi: "Tất cả môn học", labelEn: "All Subjects" },
      { id: "math", labelVi: "Toán học & Hình học", labelEn: "Mathematics" },
      { id: "science", labelVi: "Khoa học tự nhiên", labelEn: "Natural Sciences" },
      { id: "physics", labelVi: "Vật lý", labelEn: "Physics" },
      { id: "chemistry", labelVi: "Hóa học", labelEn: "Chemistry" },
      { id: "biology", labelVi: "Sinh học", labelEn: "Biology" },
      { id: "history_geo", labelVi: "Lịch sử & Địa lý", labelEn: "History & Geography" },
      { id: "stem", labelVi: "STEM & Kỹ thuật", labelEn: "STEM" },
    ];

    const types = [
      { id: "all", labelVi: "Tất cả định dạng", labelEn: "All Types" },
      { id: "3d_model", labelVi: "Mô hình 3D/XR", labelEn: "3D/XR Model" },
      { id: "virtual_lab", labelVi: "Thí nghiệm ảo", labelEn: "Virtual Lab" },
      { id: "interactive_video", labelVi: "Video tương tác", labelEn: "Interactive Video" },
      { id: "sandbox", labelVi: "Sandbox 3D", labelEn: "3D Sandbox" },
      { id: "quiz", labelVi: "Trắc nghiệm 3D", labelEn: "3D Quiz" },
    ];

    const textbooks = [
      { id: "all", label: "Tất cả bộ sách" },
      { id: "Kết Nối Tri Thức", label: "Kết Nối Tri Thức Với Cuộc Sống" },
      { id: "Cánh Diều", label: "Cánh Diều" },
      { id: "Chân Trời Sáng Tạo", label: "Chân Trời Sáng Tạo" },
    ];

    return res.status(200).json({
      success: true,
      data: {
        categories,
        grades,
        subjects,
        types,
        textbooks,
        totalMaterials,
      },
    });
  } catch (error) {
    console.error("Error in getExploreFilters:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching filters",
    });
  }
}

/**
 * GET /api/explore/:idOrSlug
 */
export async function getExploreMaterialById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const material = await prisma.exploreMaterial.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isPublished: true,
      },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Explore material not found",
      });
    }

    // Increment view count asynchronously
    prisma.exploreMaterial.update({
      where: { id: material.id },
      data: { viewsCount: { increment: 1 } },
    }).catch((e) => console.error("Could not increment views:", e));

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error("Error in getExploreMaterialById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching material",
    });
  }
}

/**
 * POST /api/explore
 * Create / Add a new 3D model or material into PostgreSQL DB
 */
export async function createExploreMaterial(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body.title || !body.category) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề (title) và Danh mục (category) là bắt buộc",
      });
    }

    const baseSlug = (body.slug || body.title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.exploreMaterial.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const newMaterial = await prisma.exploreMaterial.create({
      data: {
        slug,
        title: body.title,
        titleEn: body.titleEn || body.title,
        description: body.description || "",
        descriptionEn: body.descriptionEn || "",
        category: body.category,
        categoryLabelVi: body.categoryLabelVi || "Khoa học tự nhiên K12",
        categoryLabelEn: body.categoryLabelEn || "Natural Science K12",
        grade: body.grade || "all",
        subject: body.subject || "science",
        subjectLabelVi: body.subjectLabelVi || "Khoa học",
        subjectLabelEn: body.subjectLabelEn || "Science",
        type: body.type || "3d_model",
        typeLabelVi: body.typeLabelVi || "Mô hình 3D",
        typeLabelEn: body.typeLabelEn || "3D Model",
        modelType: body.modelType || "sphere",
        thumbnailUrl: body.thumbnailUrl || "/images/explore/default.png",
        curriculum: body.curriculum || "GDPT 2018",
        textbook: body.textbook || "Kết Nối Tri Thức",
        viewsCount: 0,
        rating: 5.0,
        tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(",").map((s: string) => s.trim()) : []),
        bilingualTerms: body.bilingualTerms || [],
        autoTourStops: body.autoTourStops || [],
        miniQuiz: body.miniQuiz || [],
        aiPromptContext: body.aiPromptContext || "",
        relatedCourseId: body.relatedCourseId,
        relatedLessonId: body.relatedLessonId,
        isPublished: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Học liệu 3D đã được lưu thành công vào Database!",
      data: newMaterial,
    });
  } catch (error) {
    console.error("Error in createExploreMaterial:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi tạo học liệu",
    });
  }
}

/**
 * PUT /api/explore/:id
 * Update an existing explore material in DB
 */
export async function updateExploreMaterial(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const body = req.body;

    const existing = await prisma.exploreMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học liệu cần cập nhật",
      });
    }

    const updated = await prisma.exploreMaterial.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        titleEn: body.titleEn ?? existing.titleEn,
        description: body.description ?? existing.description,
        descriptionEn: body.descriptionEn ?? existing.descriptionEn,
        category: body.category ?? existing.category,
        categoryLabelVi: body.categoryLabelVi ?? existing.categoryLabelVi,
        categoryLabelEn: body.categoryLabelEn ?? existing.categoryLabelEn,
        grade: body.grade ?? existing.grade,
        subject: body.subject ?? existing.subject,
        subjectLabelVi: body.subjectLabelVi ?? existing.subjectLabelVi,
        subjectLabelEn: body.subjectLabelEn ?? existing.subjectLabelEn,
        type: body.type ?? existing.type,
        typeLabelVi: body.typeLabelVi ?? existing.typeLabelVi,
        typeLabelEn: body.typeLabelEn ?? existing.typeLabelEn,
        modelType: body.modelType ?? existing.modelType,
        thumbnailUrl: body.thumbnailUrl ?? existing.thumbnailUrl,
        curriculum: body.curriculum ?? existing.curriculum,
        textbook: body.textbook ?? existing.textbook,
        tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags : body.tags.split(",").map((s: string) => s.trim())) : existing.tags,
        bilingualTerms: body.bilingualTerms ?? existing.bilingualTerms,
        autoTourStops: body.autoTourStops ?? existing.autoTourStops,
        miniQuiz: body.miniQuiz ?? existing.miniQuiz,
        aiPromptContext: body.aiPromptContext ?? existing.aiPromptContext,
        isPublished: body.isPublished !== undefined ? body.isPublished : existing.isPublished,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật học liệu thành công!",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateExploreMaterial:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi cập nhật học liệu",
    });
  }
}

/**
 * DELETE /api/explore/:id
 * Delete a material from PostgreSQL DB
 */
export async function deleteExploreMaterial(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const existing = await prisma.exploreMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học liệu cần xóa",
      });
    }

    await prisma.exploreMaterial.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: `Đã xóa học liệu "${existing.title}" khỏi cơ sở dữ liệu`,
      deletedId: id,
    });
  } catch (error) {
    console.error("Error in deleteExploreMaterial:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xóa học liệu",
    });
  }
}

/**
 * POST /api/explore/seed
 * Admin action to re-sync or restore standard curriculum materials
 */
export async function triggerSeedMaterials(_req: Request, res: Response) {
  try {
    const result = await seedExploreMaterials();
    return res.status(200).json({
      success: true,
      message: "Đã đồng bộ thành công bộ học liệu chuẩn GDPT 2018 vào Database",
      data: result,
    });
  } catch (error) {
    console.error("Error in triggerSeedMaterials:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi đồng bộ học liệu vào Database",
    });
  }
}
