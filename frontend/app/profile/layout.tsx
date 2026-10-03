import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân",
  description: "Xem và chỉnh sửa thông tin hồ sơ cá nhân của bạn trên SmartExplorer.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
