import { fetchCourses } from "@/lib/api";
import CoursesClient from "./CoursesClient";
import type { Course } from "@/types";

export const metadata = {
  title: "Khóa học | SmartExplorer",
  description: "Khám phá các khóa học STEM tương tác song ngữ.",
};

export default async function CoursesPage() {
  let courses: Course[] = [];
  let loadError = false;
  try {
    courses = await fetchCourses();
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    loadError = true;
  }
  return <CoursesClient initialCourses={courses} loadError={loadError} />;
}
