import { FLIPBOOKS_DATA } from "@/lib/flipbooks-data.config";
import BookReaderClient from "@/components/flipbook/BookReaderClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = FLIPBOOKS_DATA.find((b) => b.id === id || b.slug === id);

  if (!book) {
    return {
      title: "Sách tương tác 3D | SmartExplorer",
    };
  }

  return {
    title: `${book.titleVi} | Sách Lật Trang 3D Tương Tác`,
    description: book.descriptionVi,
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialBook = FLIPBOOKS_DATA.find((b) => b.id === id || b.slug === id) || null;

  return (
    <main className="min-h-screen bg-[#070b16] pt-20 pb-12 px-2 sm:px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <BookReaderClient initialBook={initialBook} bookId={id} />
      </div>
    </main>
  );
}

