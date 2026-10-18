import { Request, Response } from "express";
import { INITIAL_EXPLORE_MATERIALS, ExploreMaterial } from "./data.js";

// In-memory store initialized with default materials
// Allows runtime addition/customization while running, easily customizable
let materialsStore: ExploreMaterial[] = [...INITIAL_EXPLORE_MATERIALS];

/**
 * GET /api/explore
 * Query params:
 * - category: "natural_science" | "social_science" | "teaching_support" | "virtual_lab" | "sandbox" | "question_bank" | "all"
 * - grade: "6" | "7" | "8" | "9" | "all"
 * - subject: "math" | "physics" | "chemistry" | "biology" | "history_geo" | "technology" | "stem" | "all"
 * - type: "3d_model" | "virtual_lab" | "interactive_video" | "sandbox" | "quiz" | "all"
 * - search: keyword search in title, titleEn, tags, description
 * - textbook: "Kết Nối Tri Thức" | "Cánh Diều" | "Chân Trời Sáng Tạo" | "all"
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

    let results = [...materialsStore];

    // Filter by Category
    if (category && category !== "all") {
      results = results.filter((item) => item.category === category);
    }

    // Filter by Grade
    if (grade && grade !== "all") {
      results = results.filter((item) => item.grade === grade || item.grade === "all");
    }

    // Filter by Subject
    if (subject && subject !== "all") {
      results = results.filter((item) => item.subject === subject);
    }

    // Filter by Resource Type
    if (type && type !== "all") {
      results = results.filter((item) => item.type === type);
    }

    // Filter by Textbook
    if (textbook && textbook !== "all") {
      results = results.filter((item) => item.textbook.toLowerCase().includes(textbook.toLowerCase()));
    }

    // Search query
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "newest") {
      results.reverse();
    } else {
      // default: popular by views
      results.sort((a, b) => b.viewsCount - a.viewsCount);
    }

    return res.status(200).json({
      success: true,
      total: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error in listExploreMaterials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching explore materials",
    });
  }
}

/**
 * GET /api/explore/filters
 * Returns counts and available filter options for dynamic UI facets
 */
export async function getExploreFilters(_req: Request, res: Response) {
  try {
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
      { id: "ket_noi", label: "Kết Nối Tri Thức Với Cuộc Sống" },
      { id: "canh_dieu", label: "Cánh Diều" },
      { id: "chan_troi", label: "Chân Trời Sáng Tạo" },
    ];

    return res.status(200).json({
      success: true,
      data: {
        categories,
        grades,
        subjects,
        types,
        textbooks,
        totalMaterials: materialsStore.length,
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
    const { id } = req.params;
    const material = materialsStore.find((m) => m.id === id || m.slug === id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Explore material not found",
      });
    }

    // Increment view count
    material.viewsCount += 1;

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
 * Create / Add a new 3D model or material
 */
export async function createExploreMaterial(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body.title || !body.category) {
      return res.status(400).json({
        success: false,
        message: "Title and Category are required",
      });
    }

    const newMaterial: ExploreMaterial = {
      id: `exp-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: body.title,
      titleEn: body.titleEn || body.title,
      description: body.description || "",
      descriptionEn: body.descriptionEn || "",
      category: body.category,
      categoryLabelVi: body.categoryLabelVi || body.category,
      categoryLabelEn: body.categoryLabelEn || body.category,
      grade: body.grade || "all",
      subject: body.subject || "science",
      subjectLabelVi: body.subjectLabelVi || "Khoa học",
      subjectLabelEn: body.subjectLabelEn || "Science",
      type: body.type || "3d_model",
      typeLabelVi: body.typeLabelVi || "Mô hình 3D",
      typeLabelEn: body.typeLabelEn || "3D Model",
      modelType: body.modelType || "sphere",
      thumbnailUrl: body.thumbnailUrl || "/thumbnails/default.jpg",
      curriculum: body.curriculum || "GDPT 2018",
      textbook: body.textbook || "Kết Nối Tri Thức",
      viewsCount: 0,
      rating: 5.0,
      tags: body.tags || [],
      bilingualTerms: body.bilingualTerms || [],
      autoTourStops: body.autoTourStops || [],
      miniQuiz: body.miniQuiz || [],
      aiPromptContext: body.aiPromptContext || "",
      relatedCourseId: body.relatedCourseId,
      relatedLessonId: body.relatedLessonId,
    };

    materialsStore.unshift(newMaterial);

    return res.status(201).json({
      success: true,
      message: "Learning material created successfully",
      data: newMaterial,
    });
  } catch (error) {
    console.error("Error in createExploreMaterial:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating material",
    });
  }
}
