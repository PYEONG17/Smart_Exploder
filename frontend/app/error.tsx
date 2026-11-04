"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi lỗi vào dịch vụ theo dõi lỗi.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
      <div className="mx-auto w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-4">Đã xảy ra lỗi!</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Chúng tôi rất tiếc vì sự cố này. Vui lòng thử tải lại trang hoặc liên hệ bộ phận hỗ trợ nếu vấn đề vẫn tiếp diễn.
      </p>
      
      <Button onClick={() => reset()} size="lg" className="bg-blue-600 hover:bg-blue-700">
        <RefreshCcw className="w-4 h-4 mr-2" />
        Thử lại
      </Button>
    </div>
  );
}
