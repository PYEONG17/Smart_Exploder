import { notFound } from "next/navigation";
import { mockCourses, mockLessons } from "@/lib/mock-data";
import type { Course as ApiCourse, Lesson as ApiLesson } from "@/types";
import { fetchCourseById } from "@/lib/api";
import CourseDetailClient, {
  type CourseDetailCourse,
  type CourseDetailLesson,
} from "./CourseDetailClient";

function toDisplayCourse(course: ApiCourse): CourseDetailCourse {
  return {
    ...course,
    description: course.description || "",
    descriptionEn: course.descEn || "",
    subjectLabel:
      course.subjectLabel ||
      (course.subject === "math" ? "Toán học" : "Khoa học"),
    subjectLabelEn:
      course.subjectLabelEn ||
      (course.subject === "math" ? "Mathematics" : "Science"),
    lessonCount: course.lessonCount ?? course.lessons?.length ?? 0,
    color: course.color || "from-blue-600 to-indigo-700",
    enrolled: course.enrolled ?? 0,
    rating: course.rating ?? 0,
  };
}

function toDisplayLesson(lesson: ApiLesson): CourseDetailLesson {
  return {
    ...lesson,
    titleEn: lesson.titleEn || "",
    description: lesson.description || "",
    descriptionEn: lesson.descEn || "",
    duration: lesson.duration || "",
    isLocked: false,
    isCompleted: false,
  };
}

async function loadCourse(id: string): Promise<{
  course: CourseDetailCourse;
  lessons: CourseDetailLesson[];
} | null> {
  try {
    const course = await fetchCourseById(id);
    if (course) {
      return {
        course: toDisplayCourse(course),
        lessons: (course.lessons || []).map(toDisplayLesson),
      };
    }
  } catch {
    // Keep the existing demo courses available when the API is offline.
  }

  const demoCourse = mockCourses.find((item) => item.id === id);
  if (!demoCourse) return null;

  const lessons =
    demoCourse.id === "c1"
      ? mockLessons
      : Array.from({ length: demoCourse.lessonCount }, (_, index) => ({
          id: `${demoCourse.id}-l${index + 1}`,
          title: `Bài ${index + 1}: Nội dung bài học ${index + 1}`,
          titleEn: `Lesson ${index + 1}: Lesson content ${index + 1}`,
          description: `Mô tả ngắn cho bài học ${index + 1} của khóa ${demoCourse.title}`,
          descriptionEn: `Short description for lesson ${index + 1} of ${demoCourse.titleEn}`,
          order: index + 1,
          duration: "20 phút",
          courseId: demoCourse.id,
          isLocked: index > 2,
          isCompleted: index < 2,
        }));

  const course: CourseDetailCourse = {
    ...demoCourse,
    descEn: demoCourse.descriptionEn,
    descriptionEn: demoCourse.descriptionEn,
    lessons: lessons.map((lesson) => ({
      ...lesson,
      descEn: lesson.descriptionEn,
      descriptionEn: lesson.descriptionEn,
    })),
  };
  return {
    course,
    lessons: (course.lessons ?? []).map(toDisplayLesson),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadCourse(id);
  if (!data) return { title: "Khóa học không tìm thấy" };
  const { course } = data;

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: `${course.title} | SmartExplorer`,
      description: course.description,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadCourse(id);
  if (!data) notFound();
  const { course, lessons } = data;
  return <CourseDetailClient course={course} lessons={lessons} />;
}
