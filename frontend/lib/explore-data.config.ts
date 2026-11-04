export interface BilingualTerm {
  termVi: string;
  termEn: string;
  definitionVi: string;
  definitionEn: string;
  phonetics?: string;
  partOfSpeech?: string;
  exampleEn?: string;
  exampleVi?: string;
}

export interface AutoTourStop {
  id: string;
  stepNumber: number;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  cameraPosition: [number, number, number];
  highlightPart?: string;
}

export interface MiniQuizQuestion {
  id: string;
  questionVi: string;
  questionEn: string;
  optionsVi: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationVi: string;
  explanationEn: string;
}

export type ExploreCategoryKey =
  | "all"
  | "natural_science"
  | "social_science"
  | "teaching_support"
  | "virtual_lab"
  | "sandbox"
  | "technology_science"
  | "culture_history"
  | "question_bank";

export interface ExploreMaterial {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: ExploreCategoryKey;
  categoryLabelVi: string;
  categoryLabelEn: string;
  grade: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "all";
  subject: "math" | "physics" | "chemistry" | "biology" | "history_geo" | "technology" | "stem" | "science";
  subjectLabelVi: string;
  subjectLabelEn: string;
  type: "3d_model" | "virtual_lab" | "interactive_video" | "sandbox" | "quiz";
  typeLabelVi: string;
  typeLabelEn: string;
  modelType: string;
  uploadedModelUrl?: string | null;
  thumbnailUrl?: string;
  curriculum: string;
  textbook: string;
  viewsCount: number;
  rating: number;
  tags: string[];
  bilingualTerms: BilingualTerm[];
  autoTourStops: AutoTourStop[];
  miniQuiz: MiniQuizQuestion[];
  aiPromptContext: string;
  relatedCourseId?: string;
}

export const EXPLORE_CATEGORIES: {
  id: ExploreCategoryKey;
  labelVi: string;
  labelEn: string;
  iconName: string;
  badge?: string;
}[] = [
  { id: "all", labelVi: "Tất cả học liệu", labelEn: "All Materials", iconName: "Sparkles" },
  { id: "natural_science", labelVi: "Khoa học tự nhiên K12", labelEn: "Natural Science K12", iconName: "Atom", badge: "K-9 Core" },
  { id: "social_science", labelVi: "Khoa học xã hội & Địa lý", labelEn: "Social Science & Geography", iconName: "Globe" },
  { id: "teaching_support", labelVi: "Cảnh 3D theo bài K12", labelEn: "3D Lesson Scenes", iconName: "Layers", badge: "3D XR" },
  { id: "virtual_lab", labelVi: "Kho thí nghiệm ảo K12", labelEn: "Virtual Simulation Lab", iconName: "FlaskConical", badge: "Lab" },
  { id: "sandbox", labelVi: "Sandbox & STEM 3D", labelEn: "Sandbox & STEM 3D", iconName: "Box" },
  { id: "technology_science", labelVi: "Khoa học công nghệ", labelEn: "Science & Technology", iconName: "Cpu" },
  { id: "culture_history", labelVi: "Văn hóa lịch sử", labelEn: "Culture & History", iconName: "Landmark" },
  { id: "question_bank", labelVi: "Ngân hàng câu hỏi K12", labelEn: "Question Bank K12", iconName: "HelpCircle", badge: "Quiz" },
];

export const EXPLORE_GRADES = [
  { id: "all", labelVi: "Tất cả khối lớp", labelEn: "All Grades" },
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

export const EXPLORE_SUBJECTS = [
  { id: "all", labelVi: "Tất cả môn học", labelEn: "All Subjects" },
  { id: "math", labelVi: "Toán học & Hình học", labelEn: "Mathematics" },
  { id: "science", labelVi: "Khoa học tự nhiên", labelEn: "Natural Sciences" },
  { id: "physics", labelVi: "Vật lý", labelEn: "Physics" },
  { id: "chemistry", labelVi: "Hóa học", labelEn: "Chemistry" },
  { id: "biology", labelVi: "Sinh học", labelEn: "Biology" },
  { id: "history_geo", labelVi: "Lịch sử & Địa lý", labelEn: "History & Geography" },
  { id: "stem", labelVi: "STEM & Kỹ thuật", labelEn: "STEM" },
];

export const EXPLORE_TYPES = [
  { id: "all", labelVi: "Tất cả định dạng", labelEn: "All Formats" },
  { id: "3d_model", labelVi: "Mô hình 3D/XR", labelEn: "3D/XR Model" },
  { id: "virtual_lab", labelVi: "Thí nghiệm ảo", labelEn: "Virtual Lab" },
  { id: "interactive_video", labelVi: "Video tương tác", labelEn: "Interactive Video" },
  { id: "sandbox", labelVi: "Sandbox 3D", labelEn: "3D Sandbox" },
  { id: "quiz", labelVi: "Trắc nghiệm 3D", labelEn: "3D Quiz" },
];

export const EXPLORE_TEXTBOOKS = [
  { id: "all", label: "Tất cả bộ sách" },
  { id: "ket_noi", label: "Kết Nối Tri Thức Với Cuộc Sống" },
  { id: "canh_dieu", label: "Cánh Diều" },
  { id: "chan_troi", label: "Chân Trời Sáng Tạo" },
];
