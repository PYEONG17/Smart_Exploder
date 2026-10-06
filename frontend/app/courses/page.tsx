import { fetchCourses } from "@/lib/api";
import CoursesClient from "./CoursesClient";
import { mockCourses } from "@/lib/mock-data";
import type { Course } from "@/types";

export const metadata = {
  title: "Khóa học | SmartExplorer",
  description: "Khám phá các khóa học STEM tương tác song ngữ.",
};

export default async function CoursesPage() {
  // [BƯỚC 1]: Gọi API từ backend thông qua hàm fetchCourses() ở file lib/api.ts
  // Hàm này sẽ fetch tới /api/courses, backend sẽ dùng Prisma (course.controller.ts) query DB PostgreSQL.
  let courses: Course[] | null = null;
  try {
    courses = await fetchCourses();
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }
  
  // [BƯỚC 2]: Cơ chế Fallback (Dự phòng)
  // Trong quá trình phát triển (Dev), nếu Database PostgreSQL chưa có dữ liệu (length === 0) 
  // hoặc bị lỗi kết nối mạng, chúng ta sẽ tạm thời gán bằng mockCourses để giao diện vẫn hiển thị đẹp.
  // 👉 GHI CHÚ CHO BẠN: Sau khi bạn dùng trang Admin/Teacher hoặc Postman để thêm Course vào DB thật,
  // bạn có thể xóa đoạn if này đi để frontend luôn hiển thị dữ liệu thật 100% từ Database.
  if (!courses || courses.length === 0) {
    courses = mockCourses as unknown as Course[];
  }

  // [BƯỚC 3]: Truyền dữ liệu xuống Client Component để render giao diện
  // CoursesClient là nơi chứa các state logic như lọc, tìm kiếm, hiệu ứng (framer-motion).
  return <CoursesClient initialCourses={courses} />;
}
