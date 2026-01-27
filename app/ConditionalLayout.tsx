'use client';

import { usePathname } from 'next/navigation';
import { Providers } from "./providers";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // หน้า Print
  const isPrintPage = pathname?.startsWith('/report/print') || pathname?.startsWith('/report/rptallsumadmin')
  || pathname?.startsWith('/report/rptshowmatchAdminNew')
  || pathname?.startsWith('/report/rptshowmatch');

  // หน้า Admin
  const isAdminPage = pathname?.startsWith('/admin');

  // หน้า Unicorn (Interactive)
  const isUnicornPage = pathname?.startsWith('/unicorn');

  // ⛔ ไม่ต้องมี Header/Footer ในหน้าเหล่านี้
  if (isPrintPage || isAdminPage || isUnicornPage) {
    return <>{children}</>;
  }

  // ✔ หน้า User ปกติ
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Image */}
      <img src="/head-1.png" alt="header banner" className="w-full h-auto object-cover" />

      <main className="flex-grow">
        <Providers>
        {children}
        </Providers>
      </main>

      {/* Footer Image */}
      <img src="/foot.png" alt="footer banner" className="w-full h-auto object-cover" />
    </div>
  );
}
