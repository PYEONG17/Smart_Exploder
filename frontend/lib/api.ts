import type {
  Course,
  ClassItem,
  Lesson,
  Video,
  Material,
  CreateCourseDTO,
  CreateLessonDTO,
  QuestionType,
  ProgressStatus,
  ActivityType,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type LessonWithCourse = Lesson & {
  course: Course & { lessons: Lesson[] };
};

export type LessonQuestion = {
  id: string;
  lessonId: string;
  authorId: string;
  question: string;
  questionLanguage: "vi" | "en";
  questionTranslated: string;
  answer: string | null;
  answerLanguage: "vi" | "en" | null;
  answerTranslated: string | null;
  answeredById: string | null;
  answeredAt: string | null;
  createdAt: string;
};

async function readLessonQuestionResponse(
  res: Response,
): Promise<LessonQuestion[]> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load lesson questions");
  }
  return json.data;
}

export async function fetchLessonQuestions(
  token: string,
  lessonId: string,
): Promise<LessonQuestion[]> {
  return readLessonQuestionResponse(
    await fetch(
      `${API_URL}/lessons/${encodeURIComponent(lessonId)}/questions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    ),
  );
}

export async function postLessonQuestion(
  token: string,
  lessonId: string,
  input: { text: string; language: "vi" | "en" },
): Promise<LessonQuestion> {
  const res = await fetch(
    `${API_URL}/lessons/${encodeURIComponent(lessonId)}/questions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to post lesson question");
  }
  return json.data;
}

export async function answerLessonQuestion(
  token: string,
  questionId: string,
  input: { text: string; language: "vi" | "en" },
): Promise<LessonQuestion> {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/answer`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to save teacher answer");
  }
  return json.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── GIAO TIẾP VỚI BACKEND (DATABASE THẬT) VÀ DỮ LIỆU GIẢ (MOCK DATA)
// Hướng dẫn:
// - Hiện tại các hàm đang sử dụng cơ chế "Fallback": Nghĩa là nếu backend chết
//   hoặc DB PostgreSQL chưa có dữ liệu, code sẽ tự động trả về `mockData` để không bị trắng màn hình.
// - KHI BẠN ĐÃ CÓ DATA THẬT TRONG DB: Bạn có thể bỏ các khối try-catch fallback này
//   để đảm bảo luồng lỗi (throw Error) diễn ra bình thường và xử lý lỗi trên UI.
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_URL}/courses`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch courses");
  }
  return json.data;
}

export async function fetchCourseById(
  id: string,
  token?: string | null,
): Promise<Course | null> {
  const res = await fetch(`${API_URL}/courses/${id}`, {
    cache: "no-store",
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
  const json = await res.json();
  if (res.status === 404) return null;
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch course");
  }
  return json.data;
}

export async function fetchClasses(): Promise<ClassItem[]> {
  const res = await fetch(`${API_URL}/classes`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch classes");
  }
  return json.data;
}

export async function fetchLessonById(
  id: string,
  token: string,
): Promise<LessonWithCourse | null> {
  const res = await fetch(`${API_URL}/lessons/${id}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (res.status === 404) return null;
  if (!res.ok || !json.success) {
    if (res.status === 403 && json.code === "LESSON_LOCKED") {
      throw new Error(`LESSON_LOCKED:${json.message}`);
    }
    throw new Error(json.message || "Failed to fetch lesson");
  }
  return json.data;
}

export async function submitQuizResult(
  token: string,
  quizId: string,
  answers: Record<string, string>,
): Promise<{ score: number; totalQuestions: number; percentage: number }> {
  const res = await fetch(`${API_URL}/quizzes/${quizId}/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to submit quiz");
  }
  return json.data;
}

export type StudyFlashcardRecord = {
  id: string;
  front: string;
  back: string;
  tag: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PracticeQuestionRecord = {
  id: string;
  question: string;
  options: string[];
  explanation: string;
  topic: string;
  createdAt: string;
};

async function readStudyResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Study request failed");
  }
  return json.data as T;
}

export async function fetchStudyFlashcards(
  token: string,
): Promise<StudyFlashcardRecord[]> {
  return readStudyResponse(
    await fetch(`${API_URL}/study/flashcards`, {
      headers: { Authorization: ["Bearer", token].join(" ") },
      cache: "no-store",
    }),
  );
}

export async function createStudyFlashcard(
  token: string,
  input: Pick<StudyFlashcardRecord, "front" | "back" | "tag">,
): Promise<StudyFlashcardRecord> {
  return readStudyResponse(
    await fetch(`${API_URL}/study/flashcards`, {
      method: "POST",
      headers: {
        Authorization: ["Bearer", token].join(" "),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );
}

export async function setStudyFlashcardMastered(
  token: string,
  flashcardId: string,
  mastered: boolean,
): Promise<StudyFlashcardRecord> {
  return readStudyResponse(
    await fetch(
      `${API_URL}/study/flashcards/${encodeURIComponent(flashcardId)}/mastered`,
      {
        method: "PATCH",
        headers: {
          Authorization: ["Bearer", token].join(" "),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mastered }),
      },
    ),
  );
}

export async function deleteStudyFlashcard(
  token: string,
  flashcardId: string,
): Promise<{ id: string }> {
  return readStudyResponse(
    await fetch(
      `${API_URL}/study/flashcards/${encodeURIComponent(flashcardId)}`,
      {
        method: "DELETE",
        headers: { Authorization: ["Bearer", token].join(" ") },
      },
    ),
  );
}

export async function fetchPracticeQuestions(
  token: string,
): Promise<PracticeQuestionRecord[]> {
  return readStudyResponse(
    await fetch(`${API_URL}/study/practice-questions`, {
      headers: { Authorization: ["Bearer", token].join(" ") },
      cache: "no-store",
    }),
  );
}

export async function createPracticeQuestion(
  token: string,
  input: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    topic: string;
  },
): Promise<PracticeQuestionRecord> {
  return readStudyResponse(
    await fetch(`${API_URL}/study/practice-questions`, {
      method: "POST",
      headers: {
        Authorization: ["Bearer", token].join(" "),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );
}

export async function submitPracticeAnswer(
  token: string,
  questionId: string,
  selectedAnswerIndex: number,
): Promise<{
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
}> {
  return readStudyResponse(
    await fetch(
      `${API_URL}/study/practice-questions/${encodeURIComponent(questionId)}/answer`,
      {
        method: "POST",
        headers: {
          Authorization: ["Bearer", token].join(" "),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedAnswerIndex }),
      },
    ),
  );
}

export async function saveProgress(
  token: string,
  lessonId: string,
  status: "COMPLETED" | "IN_PROGRESS",
) {
  const res = await fetch(`${API_URL}/progress/${lessonId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to save progress");
  }
  return json.data;
}

export type ProgressSummary = {
  id: string;
  lessonId: string;
  status: ProgressStatus;
  score: number | null;
  completedAt: string | null;
  updatedAt: string;
  lesson: {
    id: string;
    title: string;
    titleEn: string | null;
    courseId: string;
    course: { id: string; title: string; titleEn: string | null };
  };
};

export async function fetchMyProgress(
  token: string,
): Promise<ProgressSummary[]> {
  const res = await fetch(`${API_URL}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch progress");
  }
  return json.data;
}

export async function fetchMyQuizAttempts(
  token: string,
  quizId?: string,
): Promise<QuizAttemptSummary[]> {
  const query = quizId ? `?quizId=${encodeURIComponent(quizId)}` : "";
  const res = await fetch(`${API_URL}/quizzes/attempts${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch quiz history");
  }
  return json.data;
}

export type LearningAnalyticsSummary = {
  period: "7d" | "30d" | "90d";
  metrics: {
    watchSeconds: number;
    activeDays: number;
    activeSessions: number;
    quizAttempts: number;
    averageQuizPercentage: number | null;
    engagementScore: number;
    engagementComponents: {
      key: string;
      value: number;
      points: number;
      target: number;
      earnedPoints: number;
    }[];
    lessonsCompleted: number;
    lessonsTracked: number;
    completionRate: number | null;
  };
  daily: {
    date: string;
    watchSeconds: number;
    activeSessions: number;
  }[];
  topicMastery: { available: boolean; reason: string };
  riskSignals: { available: boolean; reason: string };
};

export async function fetchMyLearningAnalytics(
  token: string,
  period: "7d" | "30d" | "90d" = "7d",
): Promise<LearningAnalyticsSummary> {
  const res = await fetch(
    `${API_URL}/analytics/me?period=${encodeURIComponent(period)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch learning analytics");
  }
  return json.data;
}

export async function recordVideoWatchHeartbeat(
  token: string,
  videoId: string,
  input: {
    clientEventId: string;
    sessionId: string;
    positionMs: number;
    occurredAt: string;
  },
): Promise<void> {
  const res = await fetch(
    `${API_URL}/analytics/videos/${encodeURIComponent(videoId)}/heartbeat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to record video watch time");
  }
}

export type AvailableQuiz = {
  id: string;
  title: string;
  titleEn?: string | null;
  questions: {
    id: string;
    question: string;
    questionEn?: string | null;
    type: QuestionType;
    answers: { id: string; content: string; contentEn?: string | null }[];
  }[];
  lesson: {
    id: string;
    title: string;
    titleEn: string | null;
    course: { id: string; title: string; titleEn: string | null };
  };
};

export type CreateLessonQuizInput = {
  title?: string;
  titleEn?: string;
  sourceLanguage?: "vi" | "en";
  questions: {
    question: string;
    questionEn?: string;
    type: QuestionType;
    answers: { content: string; contentEn?: string; isCorrect: boolean }[];
  }[];
};

export type AssessmentDifficulty = "EASY" | "MEDIUM" | "HARD";
export type GeneratedAssessmentInput = {
  grade: number;
  subject: string;
  difficulty: AssessmentDifficulty;
  topic: string;
  question_count: number;
  locale?: "vi" | "en";
};

export type GeneratedAssessment = {
  quiz: {
    title: string;
    grade: number;
    subject: string;
    topic: string;
    target_difficulty: AssessmentDifficulty;
    question_count: number;
  };
  questions: {
    question_number: number;
    type: "MCQ" | "TRUE_FALSE" | "MATCHING" | "FILL_BLANK" | "SHORT_ANSWER";
    prompt: string;
    choices?: string[];
    left_items?: string[];
    right_items?: string[];
    max_points?: number;
    bloom_taxonomy:
      | "REMEMBER"
      | "UNDERSTAND"
      | "APPLY"
      | "ANALYZE"
      | "EVALUATE"
      | "CREATE";
    difficulty_score: number;
  }[];
  answers: {
    question_number: number;
    type: GeneratedAssessment["questions"][number]["type"];
    correct_answer?: string | boolean;
    acceptable_answers?: string[];
    correct_pairs?: { left: string; right: string }[];
    answer_guide?: string;
    rubric?: { criterion: string; points: number }[];
  }[];
  explanations: { question_number: number; explanation: string }[];
  difficulty_score: number;
};

export async function generateAssessment(
  token: string,
  input: GeneratedAssessmentInput,
): Promise<GeneratedAssessment> {
  const res = await fetch(`${API_URL}/ai/assessments/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to generate assessment");
  }
  return json.data;
}

export type CreateLessonVideoInput = {
  title?: string;
  titleEn?: string;
  sourceLanguage?: "vi" | "en";
  url: string;
  durationSeconds?: number;
  activities?: {
    timestamp?: number;
    timestampMs?: number;
    type: ActivityType;
    sourceLanguage?: "vi" | "en";
    content: unknown;
  }[];
};

export type QuizAttemptSummary = {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
    titleEn: string | null;
    lessonId: string;
  };
};

export async function fetchAvailableQuizzes(
  token: string,
): Promise<AvailableQuiz[]> {
  const res = await fetch(`${API_URL}/quizzes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch assignments");
  }
  return json.data;
}

async function postLessonContent<T>(
  token: string,
  lessonId: string,
  resource: "quizzes" | "videos",
  data: CreateLessonQuizInput | CreateLessonVideoInput,
): Promise<T> {
  const res = await fetch(`${API_URL}/lessons/${lessonId}/${resource}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to save lesson content");
  }
  return json.data;
}

export function createLessonQuiz(
  token: string,
  lessonId: string,
  data: CreateLessonQuizInput,
) {
  return postLessonContent(token, lessonId, "quizzes", data);
}

export function createLessonVideo(
  token: string,
  lessonId: string,
  data: CreateLessonVideoInput,
) {
  return postLessonContent(token, lessonId, "videos", data);
}

export async function updateLessonVideoMetadata(
  token: string,
  videoId: string,
  data: {
    title?: string;
    durationSeconds?: number;
    sourceLanguage?: "vi" | "en";
  },
): Promise<Video> {
  const res = await fetch(`${API_URL}/videos/${encodeURIComponent(videoId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message || "Could not update video title");
  return json.data;
}

export async function submitVideoActivityAnswer(
  token: string,
  videoId: string,
  activityId: string,
  selectedIndex: number,
): Promise<{
  isCorrect: boolean;
  explanation: string | null;
  explanationEn: string | null;
}> {
  const res = await fetch(
    `${API_URL}/videos/${videoId}/activities/${activityId}/answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ selectedIndex }),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to answer video checkpoint");
  }
  return json.data;
}

export type InteractiveEventResponse =
  | { type: "QUESTION" | "QUIZ"; selectedIndex: number }
  | { type: "DRAG_DROP"; assignments: Record<string, string> }
  | { type: "MATCHING"; pairs: Record<string, string> }
  | { type: "FILL_BLANK"; values: Record<string, string> }
  | { type: "POLL"; selectedOptionIds: string[] }
  | { type: "REFLECTION"; text: string }
  | {
      type: "EXPLANATION" | "VOCABULARY" | "AI_EXPLANATION";
      viewed: true;
    };

export async function submitInteractiveEventResponse(
  token: string,
  videoId: string,
  activityId: string,
  input: {
    clientEventId: string;
    durationMs: number;
    response: InteractiveEventResponse;
  },
): Promise<{
  attemptId: string;
  accepted: boolean;
  isCorrect: boolean | null;
  score: number | null;
  explanation: string | null;
  explanationEn: string | null;
}> {
  const res = await fetch(
    `${API_URL}/videos/${videoId}/activities/${activityId}/responses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to submit interactive response");
  }
  return json.data;
}

export interface InteractiveVideoAnalytics {
  activityId: string;
  timestampMs: number;
  type: string;
  attempts: number;
  uniqueParticipants: number;
  gradedAttempts: number;
  correctAttempts: number;
  correctnessRate: number | null;
  averageDurationMs: number | null;
  pollOptionCounts: Record<string, number> | null;
}

export async function fetchInteractiveVideoAnalytics(
  token: string,
  videoId: string,
): Promise<InteractiveVideoAnalytics[]> {
  const res = await fetch(`${API_URL}/videos/${videoId}/activities/analytics`, {
    headers: { Authorization: "Bearer " + token },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(
      json.message || "Failed to load interactive video analytics",
    );
  }
  return json.data;
}

// ─────────────────────────────────────────────
// TEACHER STUDIO CREATION APIs
// ─────────────────────────────────────────────

export async function createCourse(
  token: string,
  data: CreateCourseDTO,
): Promise<{ success: boolean; data: Course }> {
  const res = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    const validationDetails = Array.isArray(json.errors)
      ? json.errors
          .map((issue: { path?: unknown; message?: unknown }) =>
            [
              typeof issue.path === "string" && issue.path
                ? `${issue.path}: `
                : "",
              typeof issue.message === "string" ? issue.message : "",
            ].join(""),
          )
          .filter(Boolean)
          .join("; ")
      : "";
    throw new Error(
      [json.message || "Failed to create course", validationDetails]
        .filter(Boolean)
        .join(": "),
    );
  }
  return json;
}

export async function uploadCourseMedia(
  token: string,
  file: File,
  target: { kind: "thumbnail" } | { kind: "lesson-video"; lessonId: string },
): Promise<{ url: string }> {
  const endpoint =
    target.kind === "thumbnail"
      ? `${API_URL}/uploads/thumbnail`
      : `${API_URL}/uploads/lessons/${encodeURIComponent(target.lessonId)}/video`;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success || typeof json.data?.url !== "string") {
    throw new Error(json.message || "Failed to upload media");
  }
  return { url: json.data.url };
}

export async function uploadLessonMaterial(
  token: string,
  lessonId: string,
  file: File,
  title: string,
  type: "PDF" | "DOCUMENT" | "OTHER",
): Promise<Material> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("type", type);
  const res = await fetch(
    `${API_URL}/uploads/lessons/${encodeURIComponent(lessonId)}/material`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to upload lesson material");
  }
  return json.data;
}

export async function createLessonMaterial(
  token: string,
  lessonId: string,
  input: {
    title: string;
    type: "PDF" | "DOCUMENT" | "MODEL_3D" | "OTHER";
    url: string;
  },
): Promise<Material> {
  const res = await fetch(
    `${API_URL}/uploads/lessons/${encodeURIComponent(lessonId)}/material-link`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to save lesson material link");
  }
  return json.data;
}

export async function createLesson(
  token: string,
  data: CreateLessonDTO,
): Promise<{ success: boolean; data: Lesson }> {
  const res = await fetch(`${API_URL}/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create lesson");
  }
  return json;
}

export async function fetchMyCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_URL}/courses/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    const detail = typeof json.detail === "string" ? json.detail : undefined;
    throw new Error(
      [json.message || "Failed to fetch teacher courses", detail]
        .filter(Boolean)
        .join(": "),
    );
  }
  return json.data;
}
// ═══════════════════════════════════════════════════════════════════════════════
// ── AUTHENTICATION APIs (ĐĂNG NHẬP, ĐĂNG KÝ)
// Các API này đã kết nối hoàn thiện 100% với DB PostgreSQL.
// Dữ liệu người dùng sẽ được lưu thật sự nhờ file `backend/src/modules/auth/service.ts` (Prisma tạo User).
// Không hề dùng mock data ở đây.
// ═══════════════════════════════════════════════════════════════════════════════

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string; // Token này được cấp bởi backend (JWT), sẽ lưu vào localStorage ở Frontend
};

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER";
}): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Registration failed");
  }

  return json.data;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Login failed");
  }

  return json.data;
}

export async function loginWithGoogle(
  idToken: string,
  role: "STUDENT" | "TEACHER" = "STUDENT",
): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, role }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Google sign-in failed");
  }
  return json.data;
}

// Removed duplicate getMe function that used /auth/me

// ═══════════════════════════════════════════════════════════════════════════════
// ── USERS API  (/api/users/*)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/users/me
 * Fetches fresh user data from server (always up to date).
 */
export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message || "Failed to fetch user");
  return json.data;
}

/**
 * PATCH /api/users/me/profile
 * Update name and/or bio of current user.
 */
export async function updateMyProfile(
  token: string,
  data: { name?: string; bio?: string | null },
): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/users/me/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message || "Profile update failed");
  return json.data;
}

/**
 * POST /api/users/:id/avatar
 * Upload an avatar image file (multipart/form-data).
 */
export async function uploadAvatar(
  token: string,
  userId: string,
  file: File,
): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/users/${userId}/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message || "Avatar upload failed");
  return json.data;
}

/**
 * GET /api/users/:id/avatar/random
 * Generates a random DiceBear avatar and saves it to DB.
 */
export async function getRandomAvatar(
  token: string,
  userId: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/users/${userId}/avatar/random`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message || "Failed to get random avatar");
  return json.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── AI API  (/api/ai/*)
// ═══════════════════════════════════════════════════════════════════════════════
export async function sendChatMessage(
  token: string,
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  context?: {
    grade?: string;
    subject?: string;
    lessonTitle?: string;
    lessonDescription?: string;
    lessonId?: string;
    locale?: "vi" | "en";
  },
): Promise<string> {
  const completeHistory: typeof history = [];
  let pendingQuestion: (typeof history)[number] | null = null;
  for (const message of history) {
    if (message.role === "user") {
      pendingQuestion = message;
    } else if (pendingQuestion) {
      completeHistory.push(pendingQuestion, message);
      pendingQuestion = null;
    }
  }

  const res = await fetch(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      history: completeHistory.slice(-10),
      context,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to get AI response");
  }

  return json.data.reply;
}

export async function sendLessonTutorMessage(
  token: string,
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  context?: {
    grade?: string;
    subject?: string;
    lessonTitle?: string;
    lessonDescription?: string;
    lessonId?: string;
    locale?: "vi" | "en";
  },
): Promise<string> {
  const completeHistory: typeof history = [];
  let pendingQuestion: (typeof history)[number] | null = null;
  for (const message of history) {
    if (message.role === "user") {
      pendingQuestion = message;
    } else if (pendingQuestion) {
      completeHistory.push(pendingQuestion, message);
      pendingQuestion = null;
    }
  }

  const res = await fetch(`${API_URL}/ai/lesson-tutor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      history: completeHistory.slice(-10),
      context,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to get AI response");
  }

  return json.data.reply;
}

// ─────────────────────────────────────────────
// TEACHER CONTENT MANAGEMENT (edit / delete)
// ─────────────────────────────────────────────

async function sendManagedRequest<T>(
  token: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
  path: string,
  body?: unknown,
  fallbackMessage = "Request failed",
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: "Bearer " + token,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data as T;
}

export type UpdateCourseInput = Partial<CreateCourseDTO>;
export type UpdateLessonInput = Partial<Omit<CreateLessonDTO, "courseId">>;

export function updateCourse(
  token: string,
  courseId: string,
  data: UpdateCourseInput,
) {
  return sendManagedRequest<Course>(
    token,
    "PATCH",
    `/courses/${encodeURIComponent(courseId)}`,
    data,
    "Failed to update course",
  );
}

export function deleteCourse(token: string, courseId: string) {
  return sendManagedRequest<{ id: string }>(
    token,
    "DELETE",
    `/courses/${encodeURIComponent(courseId)}`,
    undefined,
    "Failed to delete course",
  );
}

export function updateLesson(
  token: string,
  lessonId: string,
  data: UpdateLessonInput,
) {
  return sendManagedRequest<Lesson>(
    token,
    "PATCH",
    `/lessons/${encodeURIComponent(lessonId)}`,
    data,
    "Failed to update lesson",
  );
}

export function deleteLesson(token: string, lessonId: string) {
  return sendManagedRequest<{ id: string }>(
    token,
    "DELETE",
    `/lessons/${encodeURIComponent(lessonId)}`,
    undefined,
    "Failed to delete lesson",
  );
}

export function deleteLessonContent(
  token: string,
  kind: "videos" | "quizzes" | "materials",
  id: string,
) {
  return sendManagedRequest<{ id: string }>(
    token,
    "DELETE",
    `/${kind}/${encodeURIComponent(id)}`,
    undefined,
    "Failed to delete content",
  );
}

export type VideoActivityRecord = {
  id: string;
  type: ActivityType;
  timestampMs: number;
  content: Record<string, unknown>;
};

export type VideoActivityPayload = {
  timestampMs: number;
  type: ActivityType;
  sourceLanguage?: "vi" | "en";
  content: unknown;
};

export function fetchVideoActivities(token: string, videoId: string) {
  return sendManagedRequest<VideoActivityRecord[]>(
    token,
    "GET",
    `/videos/${encodeURIComponent(videoId)}/activities`,
    undefined,
    "Failed to load checkpoints",
  );
}

export function createVideoActivity(
  token: string,
  videoId: string,
  data: VideoActivityPayload,
) {
  return sendManagedRequest<VideoActivityRecord>(
    token,
    "POST",
    `/videos/${encodeURIComponent(videoId)}/activities`,
    data,
    "Failed to create checkpoint",
  );
}

export function updateVideoActivity(
  token: string,
  activityId: string,
  data: VideoActivityPayload,
) {
  return sendManagedRequest<VideoActivityRecord>(
    token,
    "PUT",
    `/activities/${encodeURIComponent(activityId)}`,
    data,
    "Failed to update checkpoint",
  );
}

export function deleteVideoActivity(token: string, activityId: string) {
  return sendManagedRequest<{ id: string }>(
    token,
    "DELETE",
    `/activities/${encodeURIComponent(activityId)}`,
    undefined,
    "Failed to delete checkpoint",
  );
}

// ─────────────────────────────────────────────
// AI STUDIO (teacher): outline, lesson draft, resource search
// ─────────────────────────────────────────────

async function postAiStudio<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}/ai/studio${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || "AI request failed");
  }
  return json.data as T;
}

export type AiOutlineLesson = {
  title: string;
  titleEn: string;
  description: string;
  descEn: string;
  duration?: string;
};

export type AiLessonDraft = {
  description: string;
  descEn: string;
  keyPoints: { vi: string; en: string }[];
  quiz: {
    question: string;
    questionEn: string;
    options: string[];
    optionsEn: string[];
    correctIndex: number;
  }[];
};

export type AiResourceResult = {
  text: string;
  sources: { title: string; url: string }[];
};

export function generateAiCourseOutline(
  token: string,
  input: { courseId: string; topic?: string; lessonCount: number },
) {
  return postAiStudio<{ lessons: AiOutlineLesson[] }>(token, "/outline", input);
}

export function generateAiLessonDraft(token: string, lessonId: string) {
  return postAiStudio<AiLessonDraft>(
    token,
    `/lessons/${encodeURIComponent(lessonId)}/draft`,
    {},
  );
}

export function findAiLessonResources(
  token: string,
  lessonId: string,
  language: "vi" | "en",
) {
  return postAiStudio<AiResourceResult>(
    token,
    `/lessons/${encodeURIComponent(lessonId)}/resources`,
    { language },
  );
}

export function reorderCourseLessons(
  token: string,
  courseId: string,
  lessonIds: string[],
) {
  return sendManagedRequest<{ lessonIds: string[] }>(
    token,
    "PUT",
    `/courses/${encodeURIComponent(courseId)}/lessons/order`,
    { lessonIds },
    "Failed to reorder lessons",
  );
}

export function reorderLessonVideos(
  token: string,
  lessonId: string,
  videoIds: string[],
) {
  return sendManagedRequest<{ videoIds: string[] }>(
    token,
    "PUT",
    `/lessons/${encodeURIComponent(lessonId)}/videos/order`,
    { videoIds },
    "Failed to reorder videos",
  );
}
