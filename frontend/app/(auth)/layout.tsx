import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

/**
 * Bố cục xác thực với thiết kế cao cấp chia thành hai phần.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Khung bên trái - thương hiệu và trang trí */}
      <div className="hidden lg:flex w-1/2 relative bg-blue-600 overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,white,transparent)]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1632516643720-e7f0d7e6a739?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30" />
        
        <div className="relative z-10 max-w-lg text-white">
          <Link href="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">SE</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">SmartExplorer</span>
          </Link>
          
          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            Khám phá kiến thức STEM theo cách hoàn toàn mới
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-12">
            Tham gia cùng hàng ngàn học sinh khác để học hỏi, tương tác và trải nghiệm các mô hình khoa học 3D sống động nhất.
          </p>
          
          <div className="flex -space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`w-12 h-12 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-400 to-cyan-400 z-[${10-i}]`}>
                S{i}
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-2 border-blue-600 bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold z-0">
              +2k
            </div>
          </div>
          <p className="mt-4 text-sm text-blue-200">Hơn 2,000 học sinh đã tham gia</p>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        <Link
          href="/"
          className="absolute top-6 left-6 lg:hidden flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24">
          {children}
        </div>
      </div>
    </div>
  );
}
