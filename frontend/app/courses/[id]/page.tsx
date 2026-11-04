import { notFound } from "next/navigation";
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
    isLocked: lesson.isLocked ?? false,
    isCompleted: lesson.isCompleted ?? false,
  };
}

async function loadCourse(id: string): Promise<{
  course: CourseDetailCourse;
  lessons: CourseDetailLesson[];
} | null> {
  const course = await fetchCourseById(id);
  if (!course) return null;

  return {
    course: toDisplayCourse(course),
    lessons: (course.lessons || []).map(toDisplayLesson),
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
