'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// 1. เพิ่ม createPortal
import { createPortal } from 'react-dom';
// เพิ่ม icon ที่จำเป็น
import { Menu, X, User, LogOut, Home, FileEdit, Calendar, Table, Bell, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import UserDropdown from '../../components/UserDropdown';

// Interface
interface NotificationItem {
  notid: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

function Navbar({ userInfo, onLogout }: { userInfo: any; onLogout: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // --- ส่วนของระบบแจ้งเตือน ---
  const [showNoti, setShowNoti] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Ref สำหรับตรวจจับการคลิกนอก Dropdown
  const notiRef = useRef<HTMLDivElement>(null);

  // ✨ State สำหรับ Modal (Pop-up)
  const [selectedNoti, setSelectedNoti] = useState<NotificationItem | null>(null);

  // 2. ✨ State เช็คว่าโหลดหน้าเว็บเสร็จยัง (จำเป็นสำหรับ createPortal)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getActiveClass = (path: string) => {
  return pathname === path 
    ? "bg-military-700 text-white shadow-inner translate-y-0" // สไตล์ตอน Active
    : "text-primary hover:text-white hover:bg-military-700 hover:-translate-y-1 hover:shadow-lg"; // สไตล์ปกติ
  };

  // ฟังก์ชันดึงข้อมูล
  const fetchNotifications = async () => {
    if (!userInfo?.wardid) return;
    try {
      const res = await fetch(`/api/notify/user?id=${userInfo.wardid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  // ดึงข้อมูลตอนเข้าเว็บ และ Auto Refresh ทุก 1 นาที
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userInfo]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) return;

      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setShowNoti(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notiRef, isMenuOpen]); 

  // ฟังก์ชันกดอ่าน
  const handleMarkAsRead = async (notid: number, isRead: boolean) => {
    setNotifications(prev => prev.map(n => 
      n.notid === notid ? { ...n, isRead: true } : n
    ));
    
    if (!isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await fetch(`/api/notify/${notid}`, { method: 'PATCH' });
      } catch (error) {
        console.error("Error marking as read", error);
      }
    }
  };

  // ฟังก์ชันเปิด Modal แจ้งเตือน
  const handleOpenModal = (noti: NotificationItem) => {
    setSelectedNoti(noti); 
    setShowNoti(false);    
    setIsMenuOpen(false); // ปิดเมนูมือถือด้วยถ้าเปิดอยู่
    
    if (!noti.isRead) {
      handleMarkAsRead(noti.notid, false);
    }
  };

  // ฟังก์ชันลบแจ้งเตือน
  const handleDelete = async (e: React.MouseEvent | null, notid: number, isRead: boolean) => {
    if (e) e.stopPropagation();

    if (!confirm("ต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?")) return;

    try {
      setNotifications(prev => prev.filter(n => n.notid !== notid));
      
      if (!isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (selectedNoti?.notid === notid) {
        setSelectedNoti(null);
      }

      await fetch(`/api/notify/${notid}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  return (
    <>
      <nav className="nav-military text-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <button className="hover:opacity-80 transition-opacity">
                <img 
                  src="/LOGOKSP.png" 
                  alt="LOGO" 
                  className="h-12 w-auto object-contain"
                />
              </button>
            </div>

            {/* Desktop Menu - Center */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                  onClick={() => router.push('/user/sysaddwork')}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-all duration-300 text-sm font-semibold uppercase tracking-wide ${getActiveClass('/user/sysaddwork')}`}
                >
                <Home size={18} />
                <span className=''>ข้อมูลภาระงาน</span>
              </button>
              
              <button
                onClick={() => router.push('/user/rptallsum')}
                className={`flex items-center gap-2 px-4 py-2 rounded hover:text-white hover:bg-military-700 transition-all duration-500 text-sm font-semibold uppercase tracking-wide hover:-translate-y-1 hover:shadow-lg ${getActiveClass('/user/rptallsum')}`} 
              >
                <FileEdit size={18} />
                <span>แก้ไขสรุปรายวัน</span>
              </button>

              <button
                onClick={() => router.push('/user/rptallsummonth')}
                className={`flex items-center gap-2 px-4 py-2 rounded hover:text-white hover:bg-military-700 transition-all duration-500 text-sm font-semibold uppercase tracking-wide hover:-translate-y-1 hover:shadow-lg ${getActiveClass('/user/rptallsummonth')}`}
              >
                <Calendar size={18} />
                <span>สรุปรายเดือน</span>
              </button>

              <button
                onClick={() => router.push('/user/rptshowmatch')}
                className={`flex items-center gap-2 px-4 py-2 rounded hover:text-white hover:bg-military-700 transition-all duration-500 text-sm font-semibold uppercase tracking-wide hover:-translate-y-1 hover:shadow-lg ${getActiveClass('/user/rptshowmatch')}`}
              >
                <Table size={18} />
                <span>ตารางสรุป</span>
              </button>
            </div>

            {/* Desktop User & Logout - Right */}
            <div className="hidden lg:flex items-center space-x-3">
              
             {/* ✨ Desktop Notification ✨ */}
              <div className="relative "ref={notiRef}>
                <button 
                  onClick={() => setShowNoti(!showNoti)}
                  className="relative cursor-pointer hover:bg-military-800 p-2 rounded-xs duration-500 transition hover:-translate-y-1 text-sand-200 border-2  border-sand-300 bg-military-800/50  focus:outline-none"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="duration-500 absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown List (Desktop Only) */}
                {showNoti && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-200 dark:border-military-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-filter-section px-4 py-3 bg-military-50 dark:bg-military-800 border-b border-gray-200 dark:border-military-700 flex justify-between items-center">
                      <span className="font-bold text-sm text-primary">การแจ้งเตือน</span>
                      <button 
                          onClick={fetchNotifications} 
                          className="text-xs text-primary hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                          รีเฟรช
                      </button>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-military-600">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          ไม่มีการแจ้งเตือนใหม่
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.notid}
                            onClick={() => handleOpenModal(n)}
                            className={`group relative p-3 border-b border-gray-100 dark:border-military-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-military-800/50 transition-colors text-left
                              ${!n.isRead ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1 gap-2 pr-6">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                ${n.type === 'URGENT' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                {n.type === 'URGENT' ? 'ด่วน' : 'แจ้งเตือน'}
                              </span>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                 {new Date(n.createdAt).toLocaleDateString('th-TH')}
                              </span>
                            </div>
                            
                            <h4 className={`text-sm mb-1 line-clamp-1 pr-4
                              ${!n.isRead ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              Title : {n.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              Message : {n.message}
                            </p>

                            <button 
                              onClick={(e) => handleDelete(e, n.notid, n.isRead)}
                              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                              title="ลบการแจ้งเตือน"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* ✨ จบส่วนแจ้งเตือน ✨ */}

              {/* Theme Toggle */}
              <span className='duration-500 hover:-translate-y-1 hover:shadow-lg rounded-full'><ThemeToggle /></span>

              {/* <div className="flex items-center gap-2 px-4 py-2 rounded bg-military-800/50 border-2 border-sand-300 duration-500 hover:-translate-y-1 hover:shadow-lg">
                <User size={18} className="" />
                <span className=" font-bold text-sm uppercase tracking-wide">
                  {userInfo?.wardname || 'User'}
                </span>
              </div> */}
              <div className="ml-2 transition hover:-translate-y-1 hover:bg-military-800 rounded-2xl duration-500">
                 <UserDropdown userInfo={userInfo} onLogout={onLogout} />
              </div>

              {/* <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded bg-military-900/50 border-2 border-red-400 text-red-300 hover:bg-red-900/30 hover:border-red-300 transition-all font-bold uppercase tracking-wide duration-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <LogOut size={18} />
                <span className="text-sm text-primary">ออกจากระบบ</span>
              </button> */}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded hover:bg-military-700 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 space-y-2 border-t-2 border-military-800 animate-in slide-in-from-top-2">
              
              {/* ปุ่มแจ้งเตือน Mobile */}
              <div className="flex flex-col">
                <button
                    onClick={() => setShowNoti(!showNoti)} 
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded hover:bg-military-700 hover:text-white transition-all text-sm font-semibold uppercase text-left
                        ${showNoti ? 'bg-military-800 text-white' : ''}`}
                >
                    <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full animate-pulse border border-military-900"></span>
                    )}
                    </div>
                    <div className="flex justify-between w-full items-center">
                        <span>การแจ้งเตือน {unreadCount > 0 && `(${unreadCount})`}</span>
                        <span className="text-xs opacity-70">{showNoti ? '▲ ซ่อน' : '▼ แสดง'}</span>
                    </div>
                </button>

                {/* ✅ ส่วนแสดงรายการแจ้งเตือนสำหรับ Mobile (เพิ่มใหม่) */}
                {showNoti && (
                    <div className="mx-4 mt-2 mb-2 rounded-lg bg-white dark:bg-military-900 border border-gray-200 dark:border-military-700 shadow-inner overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-200 dark:bg-military-800 px-3 py-2 flex justify-end border-b dark:border-military-700">
                            <button onClick={fetchNotifications} className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Clock size={12}/> รีเฟรช
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500">ไม่มีการแจ้งเตือน</div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.notid}
                                        onClick={() => handleOpenModal(n)}
                                        className={`relative p-3 border-b border-gray-100 dark:border-military-800 last:border-0 flex gap-3 cursor-pointer
                                            ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="mt-1">
                                            {n.type === 'URGENT' 
                                                ? <AlertTriangle size={16} className="text-red-500"/> 
                                                : <Bell size={16} className="text-blue-500"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className={`text-black text-xs truncate ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(n.createdAt).toLocaleDateString('th-TH')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {n.message}
                                            </p>
                                        </div>
                                        {/* ปุ่มลบใน Mobile List */}
                                        <button 
                                            onClick={(e) => handleDelete(e, n.notid, n.isRead)}
                                            className="self-center p-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
              </div>

              <button
                onClick={() => {
                  router.push('/user/sysaddwork');
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-all text-sm font-semibold uppercase ${getActiveClass('/user/sysaddwork')}`}
              >
                <Home size={20} />
                <span>ข้อมูลภาระงาน</span>
              </button>

           
              <button
                onClick={() => {
                  router.push('/user/rptallsum');
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded hover:bg-military-700 hover:text-white transition-all text-sm font-semibold uppercase ${getActiveClass('/user/rptallsum')}`}
              >
              
                <FileEdit size={20} />
                <span>แก้ไขสรุปรายวัน</span>
              </button>

              <button
                onClick={() => {
                  router.push('/user/rptallsummonth');
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded hover:bg-military-700 hover:text-white transition-all text-sm font-semibold uppercase ${getActiveClass('/user/rptallsummonth')}`}
              >
                <Calendar size={20} />
                <span>สรุปรายเดือน</span>
              </button>

              <button
                onClick={() => {
                  router.push('/user/rptshowmatch');
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded hover:bg-military-700 hover:text-white transition-all text-sm font-semibold uppercase ${getActiveClass('/user/rptshowmatch')}`}
              >
                <Table size={20} />
                <span>ตารางสรุป</span>
              </button>

              <div className="flex items-center justify-between px-4 py-3">
                <ThemeToggle />
              </div>

              {/* 2. User Dropdown (ปรับให้แสดงผลทั้ง Desktop และ Mobile) */}
                {/* ในมือถือ: แสดงแค่ไอคอน / ใน Desktop: แสดงชื่อด้วย (จัดการใน UserDropdown ตัวเอง) */}
                <div className="w-40 m-4 ">
                  <UserDropdown userInfo={userInfo} onLogout={onLogout} />
                </div>

              {/* <div className="flex items-center gap-3 px-4 py-3 rounded bg-military-900/50 border-2 border-sand-500 mt-3">
                <User size={20} className="" />
                <span className=" font-bold text-sm uppercase">
                  {userInfo?.wardname || 'User'}
                </span>
              </div> */}
            </div>
          )}
        </div>
      </nav>

      {/* ✨ 3. Modal (Popup) ใช้ createPortal วาร์ปไปที่ body ✨ */}
      {mounted && selectedNoti && createPortal(
       <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            
            {/* พื้นหลัง: คลิกเพื่อปิด */}
            <div className="absolute inset-0" onClick={() => setSelectedNoti(null)}></div>
            
            <div className="relative bg-white dark:bg-military-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-military-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-filter-section flex items-center justify-between p-4 border-b border-gray-100 dark:border-military-800 bg-military-50 dark:bg-military-950/50">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${selectedNoti.type === 'URGENT' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                             {selectedNoti.type === 'URGENT' ? <AlertTriangle size={20}/> : <Bell size={20}/>}
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-primary">
                                {selectedNoti.type === 'URGENT' ? 'แจ้งเตือนด่วน' : 'รายละเอียดแจ้งเตือน'}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-primary">
                                <Clock size={12}/>
                                {new Date(selectedNoti.createdAt).toLocaleString('th-TH')}
                            </div>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNoti(null)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-military-800 transition-colors text-primary"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <h4 className="text-xl font-bold mb-4 text-military-800 dark:text-sand-300 leading-snug">
                        <span>Title : </span>{selectedNoti.title}
                    </h4>
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        Message : {selectedNoti.message}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-military-800 bg-gray-50 dark:bg-military-950/50 flex justify-end gap-3">
                    <button 
                        onClick={() => handleDelete(null, selectedNoti.notid, true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all text-sm font-semibold"
                    >
                        <Trash2 size={16} />
                        ลบแจ้งเตือน
                    </button>
                    
                    <button 
                        onClick={() => setSelectedNoti(null)}
                        className="px-4 py-2 rounded-lg bg-military-600 text-white hover:bg-military-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const savedUserInfo = localStorage.getItem('userInfo');

      if (!token || !savedUserInfo) {
        alert('กรุณาเข้าสู่ระบบ');
        router.replace('/login');
        return;
      }

      // ✨ เพิ่ม Try-Catch ป้องกันหน้าเว็บขาวกรณีข้อมูล User เสียหาย ✨
      try {
        const user = JSON.parse(savedUserInfo);
        const allowedDepartments = ['USER'];

        const isValidUser = user.role === 'USER' && allowedDepartments.includes(user.department);
        const isSpecialAdmin = user.role === 'ADMIN' && 
                               user.department === 'ADMINMINI' && 
                               user.wardname === 'admin';

        if (!isValidUser && !isSpecialAdmin) {
          alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
          router.replace('/no-access');
          return;
        }

        setUserInfo(user);
        setLoading(false);

      } catch (error) {
        console.error("Error parsing user info:", error);
        // ถ้าข้อมูลเสีย ให้เคลียร์ทิ้งแล้วดีดไปหน้า Login
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    alert('ออกจากระบบสำเร็จ');
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-military-900 via-military-950 to-military-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-8 py-4 bg-military-800/50 border-2 border-sand-300 rounded shadow-lg">
            <div className=" text-xl font-bold uppercase tracking-widest animate-pulse text-sand-200">
              กำลังโหลด...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-military-5 via-sand-50 to-military-100 dark:from-military-900 dark:via-military-950 dark:to-military-800 bg-pattern-camo">
      <Navbar userInfo={userInfo} onLogout={handleLogout} />
      <div className="min-h-[calc(100vh-4rem)]">
        {children}
      </div>
    </div>
  );
}