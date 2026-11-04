import { Request, Response } from "express";
import { unlink } from "node:fs/promises";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import {
  getCourseMediaUrl,
  isValidGlbFile,
  removeCourseMediaByUrls,
} from "../../utils/course-media.js";

function getExploreRequestBody(req: Request): Record<string, any> {
  const rawData = req.body?.data;
  if (typeof rawData !== "string") {
    return (req.body ?? {}) as Record<string, any>;
  }

  try {
    const parsed: unknown = JSON.parse(rawData);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }
  } catch {
    throw new AppError("Explore material data is invalid", 400);
  }
  throw new AppError("Explore material data is invalid", 400);
}

async function removeUnlinkedModel(req: Request) {
  if (!req.file) return;
  try {
    await unlink(req.file.path);
  } catch (error) {
    console.error("Could not remove unlinked 3D model upload:", error);
  }
}

async function validateUploadedModel(req: Request): Promise<string | null> {
  if (!req.file) return null;
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!(await isValidGlbFile(req.file.path))) {
    throw new AppError("The uploaded file is not a valid GLB 2.0 model", 400);
  }
  return getCourseMediaUrl(req, req.user.id, req.file.filename);
}

/**
 * GET /api/explore
 * Tham số truy vấn:
 * - category: string
 * - grade: string
 * - subject: string
 * - type: string
 * - search: từ khóa
 * - textbook: string
 * - sortBy: "popular" | "rating" | "newest"
 */
export async function listExploreMaterials(req: Request, res: Response) {
  try {
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
      uploadedModelUrl: { not: null },
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

export async function listManageableExploreMaterials(_req: Request, res: Response) {
  try {
    const materials = await prisma.exploreMaterial.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      total: materials.length,
      data: materials,
      source: "database",
    });
  } catch (error) {
    console.error("Error in listManageableExploreMaterials:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách học liệu quản lý",
    });
  }
}

export async function getManageableExploreMaterialById(req: Request, res: Response) {
  try {
    const material = await prisma.exploreMaterial.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mô hình 3D cần chỉnh sửa",
      });
    }

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error("Error in getManageableExploreMaterialById:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải mô hình 3D cần chỉnh sửa",
    });
  }
}

/**
 * GET /api/explore/filters
 * Trả về số lượng và các tùy chọn bộ lọc hiện có cho các bộ lọc giao diện động
 */
export async function getExploreFilters(_req: Request, res: Response) {
  try {
    const totalMaterials = await prisma.exploreMaterial.count({
      where: { isPublished: true, uploadedModelUrl: { not: null } },
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
      { id: "1", labelVi: "Lớp 1", labelEn: "Grade 1" },
      { id: "2", labelVi: "Lớp 2", labelEn: "Grade 2" },
      { id: "3", labelVi: "Lớp 3", labelEn: "Grade 3" },
      { id: "4", labelVi: "Lớp 4", labelEn: "Grade 4" },
      { id: "5", labelVi: "Lớp 5", labelEn: "Grade 5" },
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
    if (id === "management") {
      if (req.user?.role !== "TEACHER") {
        return res.status(req.user ? 403 : 401).json({
          success: false,
          message: req.user ? "You do not have permission to manage 3D models" : "Authentication required",
        });
      }
      return listManageableExploreMaterials(req, res);
    }

    const isTeacher = req.user?.role === "TEACHER";

    const material = await prisma.exploreMaterial.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ...(isTeacher
          ? {}
          : {
              isPublished: true,
              uploadedModelUrl: { not: null },
            }),
      },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Explore material not found",
      });
    }

    if (!isTeacher) {
      prisma.exploreMaterial.update({
        where: { id: material.id },
        data: { viewsCount: { increment: 1 } },
      }).catch((e) => console.error("Could not increment views:", e));
    }

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
 * Tạo / thêm mô hình 3D hoặc tài liệu mới vào cơ sở dữ liệu PostgreSQL
 */
export async function createExploreMaterial(req: Request, res: Response) {
  let uploadedModelUrl: string | null = null;
  try {
    const body = getExploreRequestBody(req);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      await removeUnlinkedModel(req);
      return res.status(400).json({
        success: false,
        message: "Tên mô hình là bắt buộc",
      });
    }
    uploadedModelUrl = await validateUploadedModel(req);
    if (!uploadedModelUrl) {
      throw new AppError("A GLB 2.0 model file is required", 400);
    }

    const baseSlug = (body.slug || title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Đảm bảo slug là duy nhất
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.exploreMaterial.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const newMaterial = await prisma.exploreMaterial.create({
      data: {
        slug,
        title,
        titleEn: body.titleEn || title,
        description: body.description || "",
        descriptionEn: body.descriptionEn || "",
        category: body.category || "natural_science",
        categoryLabelVi: body.categoryLabelVi || "Khoa học tự nhiên K12",
        categoryLabelEn: body.categoryLabelEn || "Natural Science K12",
        grade: body.grade || "all",
        subject: body.subject || "science",
        subjectLabelVi: body.subjectLabelVi || "Khoa học",
        subjectLabelEn: body.subjectLabelEn || "Science",
        type: body.type || "3d_model",
        typeLabelVi: body.typeLabelVi || "Mô hình 3D",
        typeLabelEn: body.typeLabelEn || "3D Model",
        modelType: "uploaded_glb",
        uploadedModelUrl,
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
    if (uploadedModelUrl) {
      await removeCourseMediaByUrls([uploadedModelUrl]);
    } else {
      await removeUnlinkedModel(req);
    }
    return res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi máy chủ khi tạo học liệu",
    });
  }
}

/**
 * PUT /api/explore/:id
 * Cập nhật tài liệu khám phá hiện có trong cơ sở dữ liệu
 */
export async function updateExploreMaterial(req: Request, res: Response) {
  let uploadedModelUrl: string | null = null;
  try {
    const id = String(req.params.id);
    const body = getExploreRequestBody(req);
    uploadedModelUrl = await validateUploadedModel(req);

    const existing = await prisma.exploreMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      await removeUnlinkedModel(req);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy học liệu cần cập nhật",
      });
    }
    if (!uploadedModelUrl && !existing.uploadedModelUrl) {
      throw new AppError("Upload a GLB 2.0 model before publishing this material", 400);
    }
    if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) {
      throw new AppError("Tên mô hình không được để trống", 400);
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
        modelType: "uploaded_glb",
        uploadedModelUrl: uploadedModelUrl ?? existing.uploadedModelUrl,
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

    if (updated.uploadedModelUrl !== existing.uploadedModelUrl) {
      await removeCourseMediaByUrls([existing.uploadedModelUrl]);
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật học liệu thành công!",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateExploreMaterial:", error);
    if (uploadedModelUrl) {
      await removeCourseMediaByUrls([uploadedModelUrl]);
    } else {
      await removeUnlinkedModel(req);
    }
    return res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi máy chủ khi cập nhật học liệu",
    });
  }
}

/**
 * DELETE /api/explore/:id
 * Xóa tài liệu khỏi cơ sở dữ liệu PostgreSQL
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
    await removeCourseMediaByUrls([existing.uploadedModelUrl]);

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
