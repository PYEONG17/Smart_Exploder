import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    template: "%s | SmartExplorer",
    default: "SmartExplorer – Nền tảng học STEM song ngữ tương tác",
  },
  description:
    "Học Toán và Khoa học qua video tương tác, bài tập thực hành, trợ lý AI và mô hình 3D trực quan dành cho học sinh trung học.",
  keywords: ["STEM", "học trực tuyến", "song ngữ", "Toán", "Khoa học", "3D", "AI"],
  openGraph: {
    title: "SmartExplorer – Nền tảng học STEM song ngữ tương tác",
    description: "Học Toán và Khoa học qua video tương tác, bài tập thực hành, trợ lý AI và mô hình 3D trực quan.",
    url: "https://smartexplorer.edu.vn",
    siteName: "SmartExplorer",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              {/* Fixed Navbar sits outside <main> for correct semantic HTML */}
              <Navbar />
              {/* pt-16 offsets content below the fixed 64px navbar */}
              <main className="min-h-screen pt-16">{children}</main>
              <Toaster richColors position="top-right" />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
