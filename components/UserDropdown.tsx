'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 1. นำเข้า createPortal
import { User, LogOut, Settings, ShieldCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserDropdownProps {
  userInfo: any;
  onLogout: () => void;
}

export default function UserModal({ userInfo, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // เช็คว่าโหลดหน้าเว็บเสร็จหรือยัง
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // จัดการปุ่ม ESC และ Scroll Lock
  useEffect(() => {
    if (isOpen) {
      // ล็อค Scroll และกันหน้าจอกระตุก (Padding correction)
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`; // ชดเชยพื้นที่ Scrollbar ที่หายไป
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup เมื่อปิดหรือเปลี่ยนหน้า
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ฟังก์ชันปิด Modal เมื่อกด ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  // ส่วนเนื้อหา Modal (แยกออกมาเพื่อให้ใช้ Portal ได้ง่าย)
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-military-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-military-700">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-military-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-full flex flex-col items-center text-center pb-4 border-b border-dashed border-gray-300 dark:border-military-600">
            <div className="h-20 w-20 bg-sand-200 rounded-full flex items-center justify-center text-military-900 mb-3 shadow-md border-4 border-white dark:border-military-800">
                <User size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">เข้าสู่ระบบโดย</p>
              <p className="text-xl font-bold text-primary dark:text-sand-100 break-words">
                {userInfo?.wardname || 'User Name'}
              </p>
            </div>
          </div>

          <div className="w-full space-y-3 mt-2">
            <button 
              onClick={() => handleNavigate('/report-system')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-military-800 text-primary dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-military-700 transition-all group"
            >
              <div className="p-2 bg-white dark:bg-military-900 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <span className="font-semibold flex-1 text-left">แจ้งปัญหาการใช้งาน</span>
            </button>

            <button 
              onClick={() => handleNavigate('/profile')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-military-800 text-primary dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-military-700 transition-all group"
            >
                <div className="p-2 bg-white dark:bg-military-900 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Settings size={20} />
              </div>
              <span className="font-semibold flex-1 text-left">ตั้งค่าโปรไฟล์</span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100 transition-colors font-bold"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-40 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-300
          ${isOpen 
            ? 'bg-military-800 text-sand-200 border-sand-300 shadow-lg' 
            : 'bg-military-800/50 text-sand-200 border-transparent hover:border-sand-300'
          }
        `}
      >
        <div className="p-1 rounded-full bg-sand-200 text-military-900">
          <User size={16} />
        </div>
        <span className="font-bold text-sm uppercase tracking-wide max-w-[150px] truncate md:block">
          {userInfo?.wardname || 'User'}
        </span>
      </button>

      {/* ใช้ Portal เพื่อย้าย Modal ไปที่ body โดยตรง แก้ปัญหา z-index และการกระพริบ */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}