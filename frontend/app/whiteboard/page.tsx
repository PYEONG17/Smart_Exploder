import { Metadata } from "next";
import WhiteboardCanvas from "@/components/whiteboard/WhiteboardCanvas";

export const metadata: Metadata = {
  title: "Bảng Trắng Tương Tác Số 3D | Smart Explorer K-9",
  description:
    "Bảng trắng tương tác số dành cho giáo viên và học sinh: vẽ hình học, ghi chú live, chèn công thức STEM, laser thuyết trình và tích hợp mô hình 3D bám sát SGK Kết Nối Tri Thức.",
};

export default function WhiteboardPage() {
  return (
    <main className="w-full h-full min-h-[calc(100vh-64px)] overflow-hidden">
      <WhiteboardCanvas />
    </main>
  );
}
