export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export type SubjectType = "math" | "science";

export type MaterialType = "PDF" | "DOCUMENT" | "MODEL_3D" | "OTHER";

export type ActivityType =
  | "QUESTION"
  | "EXPLANATION"
  | "QUIZ"
  | "DRAG_DROP"
  | "MATCHING"
  | "FILL_BLANK"
  | "POLL"
  | "REFLECTION"
  | "VOCABULARY"
  | "AI_EXPLANATION";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK";

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  streakDays?: number;
  createdAt?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  description?: string;
  studentCount?: number;
  courseCount?: number;
  color?: string;
  createdAt?: string;
}

export interface Material {
  id: string;
  title: string;
  titleEn?: string;
  type: MaterialType;
  url: string;
  lessonId: string;
  fileSize?: string;
}

export interface Answer {
  id: string;
  content: string;
  contentEn?: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  questionEn?: string;
  type: QuestionType;
  quizId: string;
  explanation?: string;
  answers: Answer[];
}

export interface Quiz {
  id: string;
  title: string;
  titleEn?: string;
  lessonId: string;
  questions: Question[];
}

export interface InteractiveActivity {
  id: string;
  timestamp: number; // in seconds
  timestampMs?: number | null;
  type: ActivityType;
  content: {
    question?: string;
    questionEn?: string;
    options?: string[];
    optionsEn?: string[];
    explanation?: string;
    explanationEn?: string;
    text?: string;
    textEn?: string;
    prompt?: string;
    promptEn?: string;
    items?: { id: string; label: string; labelEn?: string }[];
    zones?: { id: string; label: string; labelEn?: string }[];
    leftItems?: { id: string; label: string; labelEn?: string }[];
    rightItems?: { id: string; label: string; labelEn?: string }[];
    blanks?: { id: string }[];
    allowMultiple?: boolean;
    minLength?: number;
    maxLength?: number;
    dataNotice?: string;
    dataNoticeEn?: string;
    term?: string;
    termEn?: string;
    pronunciation?: string;
    definition?: string;
    definitionEn?: string;
    example?: string;
    exampleEn?: string;
    context?: string;
    contextEn?: string;
    rewindSeconds?: number;
    skipAfterAttempts?: number;
  };
  videoId: string;
}

export interface Video {
  id: string;
  title: string;
  titleEn?: string;
  url: string;
  duration?: string;
  lessonId: string;
  activities?: InteractiveActivity[];
}

export interface Lesson {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descEn?: string;
  order: number;
  duration?: string;
  courseId: string;
  isLocked?: boolean;
  isCompleted?: boolean;
  materials?: Material[];
  videos?: Video[];
  quizzes?: Quiz[];
  contentVi?: string;
  contentEn?: string;
  model3DUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descEn?: string;
  thumbnail?: string;
  subject: SubjectType;
  subjectLabel?: string;
  subjectLabelEn?: string;
  level: string; // e.g., "10", "11", "12"
  lessonCount?: number;
  duration?: string;
  enrolled?: number;
  rating?: number;
  color?: string;
  lessons?: Lesson[];
  createdAt?: string;
}

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score?: number;
  completedAt?: string;
}

export interface Model3DItem {
  id: string;
  title: string;
  titleEn: string;
  category: "Sinh học" | "Vật lý" | "Hóa học" | "Toán học";
  description: string;
  color: string;
  geometryType?: "dna" | "cell" | "solar" | "atom" | "polyhedron";
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  codeSnippet?: string;
  formula?: string;
}

export interface CreateCourseDTO {
  title: string;
  titleEn?: string;
  description?: string;
  descEn?: string;
  thumbnail?: string;
  subject: SubjectType;
  level: string;
  sourceLanguage?: "vi" | "en";
}

export interface CreateLessonDTO {
  courseId: string;
  title: string;
  titleEn?: string;
  description?: string;
  descEn?: string;
  order: number;
  duration?: string;
  sourceLanguage?: "vi" | "en";
}

export interface CreateMaterialDTO {
  lessonId: string;
  title: string;
  titleEn?: string;
  type: MaterialType;
  url: string;
}

export interface CreateVideoDTO {
  lessonId: string;
  title: string;
  titleEn?: string;
  url: string;
  duration?: string;
}
