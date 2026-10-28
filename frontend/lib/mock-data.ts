/**
 * Mock data for all frontend pages.
 * Will be replaced by API calls when backend is ready.
 */

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export const mockUser = {
  id: "u1",
  name: "Nguyễn Tiến Bình",
  email: "binh.nguyen@example.com",
  role: "STUDENT" as const,
  avatar: null,
  createdAt: "2025-09-01T00:00:00Z",
};

// ─────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────
export const mockClasses = [
  {
    id: "cl1",
    name: "Lớp 6A1",
    description: "Lớp Toán và Khoa học nâng cao dành cho học sinh lớp 6",
    studentCount: 35,
    courseCount: 4,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "cl2",
    name: "Lớp 7B2",
    description: "Lớp học STEM song ngữ cơ bản cho học sinh lớp 7",
    studentCount: 32,
    courseCount: 3,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "cl3",
    name: "Lớp 8A3",
    description: "Lớp Toán hình học và đại số nâng cao lớp 8",
    studentCount: 30,
    courseCount: 5,
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "cl4",
    name: "Lớp 9C1",
    description: "Lớp ôn thi chuyển cấp với nội dung STEM chuyên sâu",
    studentCount: 28,
    courseCount: 6,
    color: "from-orange-500 to-red-600",
  },
  {
    id: "cl5",
    name: "Lớp 6B2",
    description: "Lớp Khoa học tự nhiên cơ bản dành cho lớp 6",
    studentCount: 33,
    courseCount: 3,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "cl6",
    name: "Lớp 8B1",
    description: "Lớp học Toán ứng dụng và thí nghiệm Khoa học lớp 8",
    studentCount: 31,
    courseCount: 4,
    color: "from-pink-500 to-rose-600",
  },
];

// ─────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────
export type Subject = "math" | "science";
export type Level = "6" | "7" | "8" | "9";

export interface Course {
  id: string;
  title: string;
  titleEn: string;
  thumbnail?: string;
  description: string;
  descriptionEn: string;
  subject: Subject;
  subjectLabel: string;
  subjectLabelEn: string;
  level: Level;
  lessonCount: number;
  duration: string;
  color: string;
  enrolled: number;
  rating: number;
}

export const mockCourses: Course[] = [
  {
    id: "c1",
    title: "Phân số và số thập phân",
    titleEn: "Fractions & Decimals",
    thumbnail: "/course-c1.png",
    description:
      "Nắm vững khái niệm phân số, số thập phân và các phép tính cơ bản qua video tương tác và bài tập thực hành.",
    descriptionEn:
      "Master the concepts of fractions, decimals, and basic operations through interactive videos and practice exercises.",
    subject: "math",
    subjectLabel: "Toán học",
    subjectLabelEn: "Mathematics",
    level: "6",
    lessonCount: 12,
    duration: "4 giờ",
    color: "from-blue-500 to-blue-700",
    enrolled: 234,
    rating: 4.8,
  },
  {
    id: "c2",
    title: "Hệ thống thái dương",
    titleEn: "The Solar System",
    thumbnail: "/course-c2.png",
    description:
      "Khám phá 8 hành tinh, mặt trăng và các vật thể trong không gian qua mô hình 3D tương tác và bản đồ sao.",
    descriptionEn:
      "Explore 8 planets, moons, and space objects through interactive 3D models and star maps.",
    subject: "science",
    subjectLabel: "Khoa học",
    subjectLabelEn: "Science",
    level: "7",
    lessonCount: 10,
    duration: "3.5 giờ",
    color: "from-purple-500 to-indigo-700",
    enrolled: 189,
    rating: 4.9,
  },
  {
    id: "c3",
    title: "Hình học phẳng",
    titleEn: "Plane Geometry",
    thumbnail: "/course-c3.png",
    description:
      "Học về tam giác, tứ giác, đường tròn và các định lý hình học qua mô hình động và chứng minh tương tác.",
    descriptionEn:
      "Learn about triangles, quadrilaterals, circles, and geometry theorems through dynamic models.",
    subject: "math",
    subjectLabel: "Toán học",
    subjectLabelEn: "Mathematics",
    level: "8",
    lessonCount: 15,
    duration: "5 giờ",
    color: "from-emerald-500 to-teal-700",
    enrolled: 312,
    rating: 4.7,
  },
  {
    id: "c4",
    title: "Phương trình bậc nhất",
    titleEn: "Linear Equations",
    thumbnail: "/course-c3.png",
    description:
      "Giải phương trình bậc nhất một ẩn, hệ phương trình và ứng dụng vào bài toán thực tế.",
    descriptionEn:
      "Solve linear equations, systems of equations, and apply them to real-world problems.",
    subject: "math",
    subjectLabel: "Toán học",
    subjectLabelEn: "Mathematics",
    level: "8",
    lessonCount: 10,
    duration: "3 giờ",
    color: "from-amber-500 to-orange-700",
    enrolled: 267,
    rating: 4.6,
  },
  {
    id: "c5",
    title: "Cơ thể người",
    titleEn: "The Human Body",
    description:
      "Tìm hiểu cấu tạo và chức năng các hệ cơ quan trong cơ thể người qua hình ảnh 3D chi tiết.",
    descriptionEn:
      "Understand the structure and functions of organ systems in the human body through detailed 3D images.",
    subject: "science",
    subjectLabel: "Khoa học",
    subjectLabelEn: "Science",
    level: "8",
    lessonCount: 14,
    duration: "4.5 giờ",
    color: "from-rose-500 to-pink-700",
    enrolled: 198,
    rating: 4.8,
  },
  {
    id: "c6",
    title: "Số nguyên và phép tính",
    titleEn: "Integers & Operations",
    description:
      "Làm quen với số nguyên âm, dương và các phép cộng, trừ, nhân, chia trên tập số nguyên.",
    descriptionEn:
      "Get familiar with positive and negative integers and operations on the set of integers.",
    subject: "math",
    subjectLabel: "Toán học",
    subjectLabelEn: "Mathematics",
    level: "6",
    lessonCount: 8,
    duration: "2.5 giờ",
    color: "from-sky-500 to-cyan-700",
    enrolled: 156,
    rating: 4.5,
  },
  {
    id: "c7",
    title: "Ánh sáng và âm thanh",
    titleEn: "Light & Sound",
    description:
      "Khám phá bản chất ánh sáng, âm thanh và ứng dụng trong đời sống hằng ngày.",
    descriptionEn:
      "Discover the nature of light, sound, and their applications in everyday life.",
    subject: "science",
    subjectLabel: "Khoa học",
    subjectLabelEn: "Science",
    level: "7",
    lessonCount: 9,
    duration: "3 giờ",
    color: "from-yellow-500 to-amber-700",
    enrolled: 143,
    rating: 4.7,
  },
  {
    id: "c8",
    title: "Hàm số và đồ thị",
    titleEn: "Functions & Graphs",
    description:
      "Hiểu khái niệm hàm số, cách vẽ đồ thị hàm bậc nhất và ứng dụng trong thực tế.",
    descriptionEn:
      "Understand functions, how to plot linear function graphs, and practical applications.",
    subject: "math",
    subjectLabel: "Toán học",
    subjectLabelEn: "Mathematics",
    level: "9",
    lessonCount: 11,
    duration: "3.5 giờ",
    color: "from-violet-500 to-purple-700",
    enrolled: 201,
    rating: 4.6,
  },
  {
    id: "c9",
    title: "Hóa học cơ bản",
    titleEn: "Basic Chemistry",
    thumbnail: "/course-c9.png",
    description:
      "Tìm hiểu nguyên tử, phân tử, bảng tuần hoàn và các phản ứng hóa học cơ bản.",
    descriptionEn:
      "Learn about atoms, molecules, the periodic table, and basic chemical reactions.",
    subject: "science",
    subjectLabel: "Khoa học",
    subjectLabelEn: "Science",
    level: "9",
    lessonCount: 13,
    duration: "4 giờ",
    color: "from-teal-500 to-emerald-700",
    enrolled: 175,
    rating: 4.8,
  },
];

// ─────────────────────────────────────────────
// LESSONS (for course c1)
// ─────────────────────────────────────────────
export interface Lesson {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  order: number;
  duration: string;
  courseId: string;
  isLocked: boolean;
  isCompleted: boolean;
  threeDModelType?: "solar_system" | "atom" | "dna" | "icosahedron" | "sphere" | "torus";
}

export const mockLessons: Lesson[] = [
  {
    id: "l1",
    title: "Phân số là gì?",
    titleEn: "What is a Fraction?",
    description: "Giới thiệu khái niệm phân số, tử số và mẫu số.",
    descriptionEn:
      "Introduction to fractions, numerators, and denominators.",
    order: 1,
    duration: "20 phút",
    courseId: "c1",
    isLocked: false,
    isCompleted: true,
    threeDModelType: "sphere",
  },
  {
    id: "l2",
    title: "So sánh phân số",
    titleEn: "Comparing Fractions",
    description:
      "Cách so sánh hai phân số bằng phương pháp quy đồng mẫu số.",
    descriptionEn:
      "How to compare two fractions using common denominators.",
    order: 2,
    duration: "25 phút",
    courseId: "c1",
    isLocked: false,
    isCompleted: true,
  },
  {
    id: "l3",
    title: "Cộng và trừ phân số",
    titleEn: "Adding & Subtracting Fractions",
    description:
      "Phép cộng và trừ phân số cùng mẫu và khác mẫu.",
    descriptionEn:
      "Adding and subtracting fractions with like and unlike denominators.",
    order: 3,
    duration: "30 phút",
    courseId: "c1",
    isLocked: false,
    isCompleted: false,
    threeDModelType: "torus",
  },
  {
    id: "l4",
    title: "Nhân và chia phân số",
    titleEn: "Multiplying & Dividing Fractions",
    description:
      "Quy tắc nhân, chia phân số và phân số nghịch đảo.",
    descriptionEn:
      "Rules for multiplying, dividing fractions, and reciprocals.",
    order: 4,
    duration: "25 phút",
    courseId: "c1",
    isLocked: false,
    isCompleted: false,
  },
  {
    id: "l5",
    title: "Số thập phân",
    titleEn: "Decimal Numbers",
    description:
      "Giới thiệu số thập phân và mối quan hệ với phân số.",
    descriptionEn:
      "Introduction to decimals and their relationship with fractions.",
    order: 5,
    duration: "20 phút",
    courseId: "c1",
    isLocked: true,
    isCompleted: false,
  },
  {
    id: "l6",
    title: "Phép tính với số thập phân",
    titleEn: "Operations with Decimals",
    description:
      "Cộng, trừ, nhân, chia số thập phân trong thực tế.",
    descriptionEn:
      "Adding, subtracting, multiplying, and dividing decimals in practice.",
    order: 6,
    duration: "30 phút",
    courseId: "c1",
    isLocked: true,
    isCompleted: false,
  },
  {
    id: "l7",
    title: "Chuyển đổi phân số và thập phân",
    titleEn: "Converting Fractions & Decimals",
    description:
      "Cách chuyển phân số sang thập phân và ngược lại.",
    descriptionEn:
      "How to convert between fractions and decimals.",
    order: 7,
    duration: "25 phút",
    courseId: "c1",
    isLocked: true,
    isCompleted: false,
  },
  {
    id: "l8",
    title: "Bài toán thực tế",
    titleEn: "Real-World Problems",
    description:
      "Ứng dụng phân số và thập phân vào bài toán đời sống.",
    descriptionEn:
      "Applying fractions and decimals to real-life problems.",
    order: 8,
    duration: "35 phút",
    courseId: "c1",
    isLocked: true,
    isCompleted: false,
    threeDModelType: "icosahedron",
  },
];

// ─────────────────────────────────────────────
// LESSON CONTENT (for lesson l3)
// ─────────────────────────────────────────────
export const mockLessonContent = {
  contentVi: `
## Cộng và trừ phân số

### 1. Phân số cùng mẫu

Khi hai phân số có cùng mẫu số, ta chỉ cần cộng (hoặc trừ) các tử số và giữ nguyên mẫu số.

**Công thức:**
$$\\frac{a}{c} + \\frac{b}{c} = \\frac{a + b}{c}$$

**Ví dụ:**
$$\\frac{2}{5} + \\frac{1}{5} = \\frac{2 + 1}{5} = \\frac{3}{5}$$

### 2. Phân số khác mẫu

Khi hai phân số có mẫu số khác nhau, ta cần quy đồng mẫu số trước khi cộng hoặc trừ.

**Các bước thực hiện:**
1. Tìm mẫu số chung nhỏ nhất (MSCNN)
2. Quy đồng mẫu số
3. Cộng hoặc trừ tử số
4. Rút gọn nếu cần

**Ví dụ:**
$$\\frac{2}{3} + \\frac{1}{4} = \\frac{8}{12} + \\frac{3}{12} = \\frac{11}{12}$$

### 3. Lưu ý quan trọng
- Luôn rút gọn kết quả về dạng tối giản
- Nếu kết quả là phân số có tử lớn hơn mẫu → chuyển sang hỗn số
  `,
  contentEn: `
## Adding & Subtracting Fractions

### 1. Like Denominators

When two fractions have the same denominator, simply add (or subtract) the numerators and keep the denominator.

**Formula:**
$$\\frac{a}{c} + \\frac{b}{c} = \\frac{a + b}{c}$$

**Example:**
$$\\frac{2}{5} + \\frac{1}{5} = \\frac{2 + 1}{5} = \\frac{3}{5}$$

### 2. Unlike Denominators

When two fractions have different denominators, you need to find a common denominator first.

**Steps:**
1. Find the Least Common Denominator (LCD)
2. Convert fractions to equivalent fractions
3. Add or subtract the numerators
4. Simplify if needed

**Example:**
$$\\frac{2}{3} + \\frac{1}{4} = \\frac{8}{12} + \\frac{3}{12} = \\frac{11}{12}$$

### 3. Important Notes
- Always simplify the result to its lowest terms
- If the numerator is greater than the denominator → convert to a mixed number
  `,
};

// ─────────────────────────────────────────────
// MATERIALS (for lesson l3)
// ─────────────────────────────────────────────
export interface Material {
  id: string;
  title: string;
  titleEn: string;
  type: "PDF" | "DOCUMENT" | "MODEL_3D" | "OTHER";
  url: string;
  lessonId: string;
}

export const mockMaterials: Material[] = [
  {
    id: "m1",
    title: "Tóm tắt lý thuyết phân số",
    titleEn: "Fractions Theory Summary",
    type: "PDF",
    url: "#",
    lessonId: "l3",
  },
  {
    id: "m2",
    title: "Bài tập thực hành",
    titleEn: "Practice Exercises",
    type: "DOCUMENT",
    url: "#",
    lessonId: "l3",
  },
  {
    id: "m3",
    title: "Mô hình phân số 3D",
    titleEn: "3D Fraction Model",
    type: "MODEL_3D",
    url: "#",
    lessonId: "l3",
  },
];

// ─────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  questionEn: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK";
  answers: {
    id: string;
    content: string;
    contentEn: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  explanationEn?: string;
}

export const mockQuiz = {
  id: "q1",
  title: "Kiểm tra: Cộng và trừ phân số",
  titleEn: "Quiz: Adding & Subtracting Fractions",
  lessonId: "l3",
  courseId: "c1",
  questions: [
    {
      id: "qq1",
      question: "Kết quả của 2/3 + 1/4 là bao nhiêu?",
      questionEn: "What is the result of 2/3 + 1/4?",
      type: "MULTIPLE_CHOICE" as const,
      answers: [
        { id: "a1", content: "3/7", contentEn: "3/7", isCorrect: false },
        { id: "a2", content: "11/12", contentEn: "11/12", isCorrect: true },
        { id: "a3", content: "3/12", contentEn: "3/12", isCorrect: false },
        { id: "a4", content: "8/12", contentEn: "8/12", isCorrect: false },
      ],
      explanation:
        "Quy đồng mẫu: 2/3 = 8/12, 1/4 = 3/12. Cộng tử: 8 + 3 = 11. Kết quả: 11/12.",
      explanationEn:
        "Find common denominator: 2/3 = 8/12, 1/4 = 3/12. Add numerators: 8 + 3 = 11. Result: 11/12.",
    },
    {
      id: "qq2",
      question: "Đúng hay sai: 1/2 + 1/3 = 2/5",
      questionEn: "True or false: 1/2 + 1/3 = 2/5",
      type: "TRUE_FALSE" as const,
      answers: [
        { id: "a5", content: "Đúng", contentEn: "True", isCorrect: false },
        { id: "a6", content: "Sai", contentEn: "False", isCorrect: true },
      ],
      explanation:
        "1/2 + 1/3 = 3/6 + 2/6 = 5/6, không phải 2/5. Không thể cộng trực tiếp tử và mẫu.",
      explanationEn:
        "1/2 + 1/3 = 3/6 + 2/6 = 5/6, not 2/5. You cannot add numerators and denominators directly.",
    },
    {
      id: "qq3",
      question: "5/6 - 1/3 = ?",
      questionEn: "5/6 - 1/3 = ?",
      type: "MULTIPLE_CHOICE" as const,
      answers: [
        { id: "a7", content: "4/3", contentEn: "4/3", isCorrect: false },
        { id: "a8", content: "1/2", contentEn: "1/2", isCorrect: true },
        { id: "a9", content: "2/3", contentEn: "2/3", isCorrect: false },
        { id: "a10", content: "4/6", contentEn: "4/6", isCorrect: false },
      ],
      explanation:
        "5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2 (rút gọn).",
      explanationEn:
        "5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2 (simplified).",
    },
    {
      id: "qq4",
      question: "Mẫu số chung nhỏ nhất của 4 và 6 là bao nhiêu?",
      questionEn:
        "What is the least common denominator of 4 and 6?",
      type: "MULTIPLE_CHOICE" as const,
      answers: [
        { id: "a11", content: "24", contentEn: "24", isCorrect: false },
        { id: "a12", content: "12", contentEn: "12", isCorrect: true },
        { id: "a13", content: "10", contentEn: "10", isCorrect: false },
        { id: "a14", content: "6", contentEn: "6", isCorrect: false },
      ],
      explanation:
        "Bội chung nhỏ nhất của 4 và 6: 4 = 4, 8, 12... ; 6 = 6, 12... → BCNN = 12.",
      explanationEn:
        "LCM of 4 and 6: 4 = 4, 8, 12... ; 6 = 6, 12... → LCM = 12.",
    },
    {
      id: "qq5",
      question:
        "Đúng hay sai: Khi cộng phân số khác mẫu, ta phải quy đồng mẫu số trước.",
      questionEn:
        "True or false: When adding fractions with unlike denominators, you must find a common denominator first.",
      type: "TRUE_FALSE" as const,
      answers: [
        { id: "a15", content: "Đúng", contentEn: "True", isCorrect: true },
        { id: "a16", content: "Sai", contentEn: "False", isCorrect: false },
      ],
      explanation:
        "Đúng. Phải quy đồng mẫu số trước khi thực hiện phép cộng hoặc trừ phân số khác mẫu.",
      explanationEn:
        "True. You must find a common denominator before adding or subtracting fractions with different denominators.",
    },
  ] as QuizQuestion[],
};

// ─────────────────────────────────────────────
// PROGRESS / DASHBOARD
// ─────────────────────────────────────────────
export const mockDashboardStats = {
  enrolledCourses: 3,
  completedLessons: 15,
  averageScore: 82,
  streakDays: 7,
};

export const mockProgressData = [
  { week: "Tuần 1", lessons: 3, quizScore: 75 },
  { week: "Tuần 2", lessons: 4, quizScore: 80 },
  { week: "Tuần 3", lessons: 2, quizScore: 85 },
  { week: "Tuần 4", lessons: 5, quizScore: 78 },
  { week: "Tuần 5", lessons: 3, quizScore: 90 },
  { week: "Tuần 6", lessons: 4, quizScore: 88 },
];

export const mockRecentLessons = [
  {
    id: "l3",
    title: "Cộng và trừ phân số",
    titleEn: "Adding & Subtracting Fractions",
    courseTitle: "Phân số và số thập phân",
    progress: 60,
    courseId: "c1",
  },
  {
    id: "l-sol-3",
    title: "Sao Hỏa – Hành tinh đỏ",
    titleEn: "Mars – The Red Planet",
    courseTitle: "Hệ thống thái dương",
    progress: 30,
    courseId: "c2",
  },
  {
    id: "l-geo-2",
    title: "Tam giác cân và tam giác đều",
    titleEn: "Isosceles & Equilateral Triangles",
    courseTitle: "Hình học phẳng",
    progress: 10,
    courseId: "c3",
  },
];

// ─────────────────────────────────────────────
// AI CHAT
// ─────────────────────────────────────────────
export const mockAIChatHistory = [
  { id: "chat1", title: "Phân số và số thập phân", date: "Hôm nay" },
  { id: "chat2", title: "Hệ mặt trời", date: "Hôm qua" },
  { id: "chat3", title: "Tam giác vuông", date: "3 ngày trước" },
];

export const mockAIMessages = [
  {
    id: "msg1",
    role: "user" as const,
    content: "Tại sao 2/3 + 1/4 không bằng 3/7?",
  },
  {
    id: "msg2",
    role: "assistant" as const,
    content:
      'Câu hỏi rất hay! Khi cộng phân số, bạn **không được cộng tử và mẫu riêng lẻ**.\n\nBạn cần tìm **mẫu số chung** trước:\n\n```\n2/3 + 1/4\n= 8/12 + 3/12\n= 11/12\n```\n\nLý do là vì phân số biểu diễn "phần của một tổng thể". 2/3 và 1/4 chia tổng thể thành các phần **khác kích thước**, nên ta phải quy về cùng kích thước (cùng mẫu) trước khi cộng.',
  },
  {
    id: "msg3",
    role: "user" as const,
    content: "Cho tôi thêm ví dụ đi!",
  },
  {
    id: "msg4",
    role: "assistant" as const,
    content:
      "Tất nhiên! Đây là thêm một số ví dụ:\n\n**Ví dụ 1:** 1/2 + 1/3\n```\n= 3/6 + 2/6 = 5/6\n```\n\n**Ví dụ 2:** 3/4 - 1/6\n```\n= 9/12 - 2/12 = 7/12\n```\n\n**Ví dụ 3:** 2/5 + 3/10\n```\n= 4/10 + 3/10 = 7/10\n```\n\n💡 **Mẹo:** Để tìm mẫu số chung nhanh, hãy tìm **bội chung nhỏ nhất (BCNN)** của hai mẫu số.",
  },
];

// ─────────────────────────────────────────────
// 3D MODELS
// ─────────────────────────────────────────────
export const mock3DModels = [
  {
    id: "3d1",
    title: "Hệ Mặt Trời & Quỹ đạo Hành tinh",
    titleEn: "Solar System & Planetary Orbits",
    description: "Mô hình 3D tương tác của Hệ Mặt Trời với các hành tinh quay quanh Mặt Trời theo thời gian thực (KHTN 6 KNTT).",
    category: "Thiên văn",
    color: "from-indigo-500 to-purple-600",
    modelType: "solar_system",
  },
  {
    id: "3d2",
    title: "Cấu trúc Nguyên tử Rutherford - Bohr",
    titleEn: "Rutherford - Bohr Atomic Structure",
    description: "Cấu trúc nguyên tử với hạt nhân (proton, neutron) và các electron chuyển động theo lớp vỏ K, L (KHTN 7 KNTT).",
    category: "Hóa học",
    color: "from-cyan-500 to-blue-600",
    modelType: "atom",
  },
  {
    id: "3d3",
    title: "Chuỗi Xoắn kép DNA & Mã di truyền",
    titleEn: "DNA Double Helix & Genetics",
    description: "Cấu trúc xoắn kép mang thông tin di truyền gồm 4 loại nucleotide A, T, G, C liên kết bổ sung (KHTN 9 KNTT).",
    category: "Sinh học",
    color: "from-green-500 to-lime-600",
    modelType: "dna",
  },
  {
    id: "3d4",
    title: "Tế bào Thực vật 3D",
    titleEn: "Plant Cell Anatomy",
    description: "Mô hình bóc tách giải phẫu tế bào thực vật: vách tế bào cellulose, lục lạp quang hợp, không bào trung tâm (KHTN 6 KNTT).",
    category: "Sinh học",
    color: "from-emerald-500 to-green-600",
    modelType: "plant_cell",
  },
  {
    id: "3d5",
    title: "Giải phẫu Tim người 4 ngăn",
    titleEn: "Human Heart 4-Chamber Anatomy",
    description: "Mô hình quả tim người 4 ngăn (tâm nhĩ, tâm thất) với chu kỳ co bóp nhịp đập và hệ tuần hoàn máu (KHTN 8 KNTT).",
    category: "Sinh học",
    color: "from-rose-500 to-red-600",
    modelType: "human_heart",
  },
  {
    id: "3d6",
    title: "Cấu trúc các Lớp vỏ Trái Đất",
    titleEn: "Earth's Internal Layers",
    description: "Mô hình cắt lớp cấu tạo Trái Đất: Vỏ Trái Đất, Lớp Manti, Lõi ngoài lỏng và Lõi trong rắn (KHTN 6 KNTT).",
    category: "Thiên văn",
    color: "from-amber-500 to-orange-600",
    modelType: "earth_layers",
  },
  {
    id: "3d7",
    title: "Phân tử Nước (H₂O)",
    titleEn: "Water Molecule (H2O)",
    description: "Mô hình phân tử nước dạng góc liên kết 104.5° giữa 1 nguyên tử Oxy và 2 nguyên tử Hydro (KHTN 7 KNTT).",
    category: "Hóa học",
    color: "from-sky-500 to-blue-600",
    modelType: "molecule_h2o",
  },
  {
    id: "3d8",
    title: "Mạng Tinh thể Muối ăn (NaCl)",
    titleEn: "Sodium Chloride Crystal Lattice",
    description: "Mạng tinh thể lập phương tâm diện gồm các ion Na⁺ và Cl⁻ xen kẽ trong không gian 3 chiều (KHTN 7 KNTT).",
    category: "Hóa học",
    color: "from-violet-500 to-purple-600",
    modelType: "crystal_nacl",
  },
  {
    id: "3d9",
    title: "Lăng kính Tán sắc Ánh sáng",
    titleEn: "Light Dispersion Through Prism",
    description: "Chùm sáng trắng chiếu qua lăng kính tam giác bị khúc xạ và tán sắc thành dải cầu vồng 7 màu (KHTN 9 KNTT).",
    category: "Vật lý",
    color: "from-pink-500 to-rose-600",
    modelType: "light_prism",
  },
  {
    id: "3d10",
    title: "Từ trường Nam châm Vĩnh cửu",
    titleEn: "Permanent Magnetic Field",
    description: "Mô hình từ trường với các đường sức từ khép kín đi ra từ cực Bắc (N) và đi vào cực Nam (S) (KHTN 7 KNTT).",
    category: "Vật lý",
    color: "from-blue-500 to-indigo-600",
    modelType: "magnetic_field",
  },
  {
    id: "3d11",
    title: "Phân tử Khí Metan (CH₄)",
    titleEn: "Methane Molecule (CH4)",
    description: "Mô hình phân tử hợp chất hữu cơ Metan có cấu trúc hình học tứ diện đều góc 109.5° (KHTN 9 KNTT).",
    category: "Hóa học",
    color: "from-teal-500 to-emerald-600",
    modelType: "molecule_methane",
  },
  {
    id: "3d12",
    title: "Ba Thể của Chất: Rắn – Lỏng – Khí",
    titleEn: "Three States of Matter",
    description: "Mô phỏng sự sắp xếp và chuyển động nhiệt của các hạt phân tử ở thể Rắn, thể Lỏng và thể Khí (KHTN 6 KNTT).",
    category: "Hóa học",
    color: "from-cyan-500 to-teal-600",
    modelType: "states_of_matter",
  },
  {
    id: "3d13",
    title: "Hiện tượng Nhật thực & Nguyệt thực",
    titleEn: "Solar and Lunar Eclipse",
    description: "Mô phỏng vị trí tương đối giữa Mặt Trời, Trái Đất và Mặt Trăng tạo ra vùng bóng tối và nửa tối (KHTN 6 KNTT).",
    category: "Thiên văn",
    color: "from-yellow-500 to-amber-600",
    modelType: "solar_eclipse",
  },
  {
    id: "3d14",
    title: "Nhiễm sắc thể X & Cặp NST tương đồng",
    titleEn: "Chromosome X & Genetics",
    description: "Cấu trúc nhiễm sắc thể kép gồm hai chromatid dính nhau ở tâm động mang các chuỗi DNA cuộn xoắn (KHTN 9 KNTT).",
    category: "Sinh học",
    color: "from-purple-500 to-fuchsia-600",
    modelType: "chromosome",
  },
  {
    id: "3d15",
    title: "Phân tử Etilen (C₂H₄) Liên kết Đôi",
    titleEn: "Ethene Molecule (C2H4)",
    description: "Mô hình cấu tạo phân tử Hydrocarbon không no với liên kết đôi C=C nằm trên cùng một mặt phẳng (KHTN 9 KNTT).",
    category: "Hóa học",
    color: "from-lime-500 to-green-600",
    modelType: "molecule_ethene",
  },
  {
    id: "3d16",
    title: "Mô hình Mạch điện Kín 3D",
    titleEn: "3D Closed Electric Circuit",
    description: "Mạch điện 3D gồm nguồn điện, công tắc, dây dẫn và bóng đèn phát sáng khi đóng mạch (KHTN 8 KNTT).",
    category: "Vật lý",
    color: "from-amber-500 to-yellow-600",
    modelType: "electric_circuit",
  },
  {
    id: "3d17",
    title: "Lực đẩy Ác-si-mét 3D",
    titleEn: "3D Archimedes Buoyancy Principle",
    description: "Vật nhúng chìm trong chất lỏng chịu lực đẩy hướng lên trên bằng trọng lượng chất lỏng bị chiếm chỗ (KHTN 8 KNTT).",
    category: "Vật lý",
    color: "from-sky-500 to-cyan-600",
    modelType: "archimedes_buoyancy",
  },
  {
    id: "3d18",
    title: "Bình thông nhau 3 Nhánh",
    titleEn: "Communicating Vessels 3D",
    description: "Bộ bình thông nhau với các nhánh có hình dạng khác nhau nhưng mực chất lỏng luôn cân bằng bằng nhau (KHTN 8 KNTT).",
    category: "Vật lý",
    color: "from-blue-500 to-cyan-600",
    modelType: "fluid_pressure",
  },
  {
    id: "3d19",
    title: "Khối Đa diện Đều (Icosahedron)",
    titleEn: "Regular Polyhedra (20 Faces)",
    description: "Khối 20 mặt đều (Icosahedron) thuộc 5 khối đa diện đều Platonic trong hình học không gian (Toán học 8).",
    category: "Hình học",
    color: "from-emerald-500 to-teal-600",
    modelType: "icosahedron",
  },
  {
    id: "3d20",
    title: "Khối Vòng Không gian (Torus)",
    titleEn: "Spatial Torus Geometry",
    description: "Hình học mặt xuyến 3D tạo bởi một đường tròn quay xung quanh một trục đồng phẳng không cắt nó (Toán học 9).",
    category: "Hình học",
    color: "from-orange-500 to-amber-600",
    modelType: "torus",
  },
  {
    id: "3d21",
    title: "Khối Cầu Biến dạng Vật liệu",
    titleEn: "Interactive Morphing Sphere",
    description: "Khối cầu tương tác 3D sử dụng thuật toán biến dạng bề mặt MeshDistortMaterial thời gian thực.",
    category: "Hình học",
    color: "from-rose-500 to-pink-600",
    modelType: "sphere",
  },
];
