export function getLessonRoute(courseId: string, lessonId: string): string {
  return `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
}
