"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import FlipbookReader from "@/components/flipbook/FlipbookReader";
import {
  type FlipbookBook,
  getUserStoredBooks,
} from "@/lib/flipbooks-data.config";

interface BookReaderClientProps {
  initialBook: FlipbookBook | null;
  bookId: string;
}

export default function BookReaderClient({
  initialBook,
  bookId,
}: BookReaderClientProps) {
  const [book, setBook] = useState<FlipbookBook | null>(initialBook);
  const [isLoading, setIsLoading] = useState(!initialBook);

  useEffect(() => {
    if (!initialBook) {
      const userBooks = getUserStoredBooks();
      const found = userBooks.find(
        (b) => b.id === bookId || b.slug === bookId
      );
      if (found) {
        setBook(found);
      }
      setIsLoading(false);
    }
  }, [initialBook, bookId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-neutral-400">Đang tải sách số tương tác...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 text-white">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không tìm thấy sách tương tác</h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6">
          Cuốn sách này không tồn tại trong hệ thống hoặc đã được dọn dẹp bộ nhớ đệm trình duyệt.
        </p>
        <Link
          href="/books"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay về Thư Viện Sách</span>
        </Link>
      </div>
    );
  }

  return <FlipbookReader book={book} />;
}
