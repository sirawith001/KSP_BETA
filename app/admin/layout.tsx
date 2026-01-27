'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ตรวจสอบว่าเป็นหน้า mini หรือไม่
  const isMiniPage = pathname === '/admin';

  useEffect(() => {
    // ตรวจสอบ token และ userInfo
    const token = localStorage.getItem('token');
    const savedUserInfo = localStorage.getItem('userInfo');

    if (!token || !savedUserInfo) {
      alert('กรุณาเข้าสู่ระบบ');
      router.push('/');
      return;
    }

    const user = JSON.parse(savedUserInfo);

    // --- ส่วนที่แก้ไขเงื่อนไข ---
    // ตรวจสอบเงื่อนไข 3 ข้อ: warduser=admin, department=ADMINMINI, role=ADMIN
    const isSuperAdmin = 
      user.warduser === 'admincm' && 
      user.department === 'ADMINMINI' && 
      user.role === 'ADMIN';

    if (!isSuperAdmin) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สงวนสิทธิ์เฉพาะ Administrator หลักเท่านั้น)');
      // หากไม่ใช่ ให้ส่งกลับไปหน้าผู้ใช้ทั่วไป หรือหน้า login
      router.push('/no-access'); 
      return;
    }
    // -------------------------

    setUserInfo(user);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    alert('ออกจากระบบสำเร็จ');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  // ถ้าเป็นหน้า mini ให้แสดงแค่ children เปล่าๆ
  if (isMiniPage) {
    return <>{children}</>;
  }

  const menuItems = [
    {
      title: 'แดชบอร์ด',
      icon: '📊',
      path: '/admin/dashboard',
      active: pathname === '/admin/dashboard',
    },
    {
      title: 'จัดการหมวดหมู่งาน',
      icon: '📋',
      path: '/admin/workcat',
      active: pathname.startsWith('/admin/workcat'),
    },
    {
      title: 'รีพอร์ต',
      icon: '📋',
      path: '/admin/report',
      active: pathname.startsWith('/admin/report'),
    },
    {
      title: 'จัดการผู้ใช้',
      icon: '👥',
      path: '/admin/user',
      active: pathname.startsWith('/admin/user'),
    },
    {
      title: 'ข้อมูลภาระงานคนไข้ใน',
      icon: '🏥',
      path: '/adminmini/sysaddworkadmin',
      active: pathname.startsWith('/adminmini/sysaddworkadmin'),
    },
    {
      title: 'สรุปข้อมูลภาระงาน',
      icon: '📈',
      path: '/adminmini/rptallsumadmin',
      active: pathname.startsWith('/adminmini/rptallsumadmin'),
    },
    {
      title: 'ตารางสรุปภาระงาน',
      icon: '🔒',
      path: '/adminmini/rptshowmatchAdminNew',
      active: pathname.startsWith('/adminmini/rptshowmatchAdminNew'),
    },
    {
      title: 'สรุปข้อมูลผู้ป่วยนอก',
      icon: '💾',
      path: '/adminmini/opderrptallsumadmin',
      active: pathname.startsWith('/adminmini/opderrptallsumadmin'),
    },
    {
      title: 'รายงานเหตุการณ์งานบริการพยาบาล',
      icon: '⚙️',
      path: '/adminmini/rptallsumadminReport',
      active: pathname.startsWith('/adminmini/rptallsumadminReport'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900">
      
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-red-500/30">
        <div className="flex items-center justify-between h-16 px-4">
          
          {/* Left: Logo + Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
            >
              <span className="text-white text-xl">☰</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg"><img src="/LOGOKSP.png" alt="" /></span>
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">
                ผู้ดูแลระบบ
              </h1>
            </div>
          </div>

          {/* Right: User Info + Logout */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <span className="text-white text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {userInfo?.warduser?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-400">Admin</p>
                <p className="text-white text-sm font-semibold">{userInfo?.warduser}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 z-40
          w-64 bg-black/50 backdrop-blur-xl border-r border-red-500/30
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <nav className="p-4 space-y-2 overflow-y-auto h-full">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  item.active
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/50 border-t border-red-500/30">
          <div className="text-center text-gray-400 text-xs">
            <p>Admin Panel v1.0</p>
            <p className="mt-1">© 2025 Your Hospital</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          pt-16 transition-all duration-300
          ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}
        `}
      >
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}