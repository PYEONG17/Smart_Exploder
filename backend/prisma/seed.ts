import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const mockClasses = [
  { id: "cl1", name: "Lớp 6A1", description: "Lớp Toán và Khoa học nâng cao dành cho học sinh lớp 6" },
  { id: "cl2", name: "Lớp 7B2", description: "Lớp học STEM song ngữ cơ bản cho học sinh lớp 7" },
];

const mockCourses = [
  {
    id: "c1",
    title: "Phân số và số thập phân",
    titleEn: "Fractions & Decimals",
    description: "Nắm vững khái niệm phân số, số thập phân và các phép tính cơ bản qua video tương tác và bài tập thực hành.",
    descEn: "Master the concepts of fractions, decimals, and basic operations through interactive videos and practice exercises.",
    subject: "math",
    level: "6",
  },
  {
    id: "c2",
    title: "Hệ thống thái dương",
    titleEn: "The Solar System",
    description: "Khám phá 8 hành tinh, mặt trăng và các vật thể trong không gian qua mô hình 3D tương tác và bản đồ sao.",
    descEn: "Explore 8 planets, moons, and space objects through interactive 3D models and star maps.",
    subject: "science",
    level: "7",
  },
];

const mockLessons = [
  {
    id: "l1",
    title: "Phân số là gì?",
    titleEn: "What is a Fraction?",
    description: "Giới thiệu khái niệm phân số, tử số và mẫu số.",
    descEn: "Introduction to fractions, numerators, and denominators.",
    order: 1,
    courseId: "c1",
  },
  {
    id: "l2",
    title: "So sánh phân số",
    titleEn: "Comparing Fractions",
    description: "Cách so sánh hai phân số bằng phương pháp quy đồng mẫu số.",
    descEn: "How to compare two fractions using common denominators.",
    order: 2,
    courseId: "c1",
  },
];

async function main() {
  console.log("Start seeding...");

  // Clean existing data
  await prisma.class.deleteMany();
  await prisma.course.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.tenantMembership.deleteMany();
  await prisma.user.deleteMany();

  // Create Classes
  for (const c of mockClasses) {
    await prisma.class.create({ data: c });
  }

  // Create Courses
  for (const course of mockCourses) {
    await prisma.course.create({ data: course });
  }

  // Create Lessons
  for (const lesson of mockLessons) {
    await prisma.lesson.create({ data: lesson });
  }

  // Create User
  const user = await prisma.user.create({
    data: {
      id: "u1",
      name: "Nguyễn Tiến Bình",
      email: "binh.nguyen@example.com",
      passwordHash: "$2b$10$xyz123", // mock hash
      role: "STUDENT",
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { slug: "smart-stem" },
  });
  if (!tenant) {
    throw new Error("Apply the tenant migration before running the seed");
  }
  const studentRole = await prisma.tenantRole.findUnique({
    where: {
      tenantId_roleKey: {
        tenantId: tenant.id,
        roleKey: "STUDENT",
      },
    },
  });
  if (!studentRole) {
    throw new Error("The default tenant is missing the STUDENT role");
  }

  const membership = await prisma.tenantMembership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });
  await prisma.userRole.create({
    data: {
      tenantId: tenant.id,
      membershipId: membership.id,
      roleId: studentRole.id,
    },
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
