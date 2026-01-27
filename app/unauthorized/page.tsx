// app/unauthorized/page.tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403 - ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-gray-600 mb-8">
          คุณไม่มีสิทธิ์เข้าถึงหน้า Admin
        </p>
        <Link
          href="/"
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}