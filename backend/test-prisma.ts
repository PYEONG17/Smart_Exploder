import prisma from "./src/config/db.js";

async function main() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });
    console.log("Success:", courses.length);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
