import prisma from "../config/db.js";

export async function refreshLessonDuration(lessonId: string) {
  const videos = await prisma.video.findMany({
    where: { lessonId },
    select: { durationSeconds: true },
  });
  if (videos.length === 0) {
    await prisma.lesson.update({ where: { id: lessonId }, data: { duration: null } });
    return;
  }
  if (videos.some((video) => video.durationSeconds == null)) {
    return;
  }
  const totalSeconds = videos.reduce(
    (total, video) => total + (video.durationSeconds ?? 0),
    0,
  );
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { duration: `${minutes} phút` },
  });
}
