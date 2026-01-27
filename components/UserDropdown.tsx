'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Settings, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserDropdownProps {
  userInfo: any;
  onLogout: () => void;
}

export default function UserDropdown({ userInfo, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative  border-sand-200 rounded-xl" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-40 cursor-pointer  flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-300
          ${isOpen 
            ? 'bg-military-800 text-sand-200 border-sand-300 shadow-lg' 
            : 'bg-military-800/50 text-sand-200 border-transparen '
          }
        `}
      >
        <div className="p-1 rounded-full bg-sand-200 text-military-900 ">
          <User size={16} />
        </div>
        <span className=" font-bold text-sm uppercase tracking-wide max-w-[150px]  md:block">
          {userInfo?.wardname || 'User'}
        </span>

      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-2 w-40 origin-top-right rounded-lg bg-white dark:bg-military-900 shadow-xl border border-blue-200 dark:border-military-700 ">
          <div className="px-4 py-3 border-2 rounded-lg border-sand-200 bg-filter-section">
            <p className="text-xs text-primary">เข้าสู่ระบบโดย</p>
            <p className="text-sm font-bold text-primary truncate ">
              {userInfo?.wardname || 'User Name'}
            </p>
          </div>

          <div className="cursor-pointer ">

            <button 
              onClick={() => router.push('/report-system')}
              className="mt-1 bg-dropdown-user rounded-lg flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-blue-200  transition-colors"
            >
                
              <ShieldCheck className='text-primary' size={16} />
              <span className='text-primary cursor-pointer '>แจ้งปัญหา</span>
            </button>


            <button 
              onClick={() => router.push('/profile')}
              className="mt-1 bg-dropdown-user rounded-lg flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-blue-200  transition-colors"
            >
                
              <Settings className='text-primary' size={16} />
              <span className='text-primary cursor-pointer'>ตั้งค่าโปรไฟล์</span>
            </button>
            
            <div className="m-2 border  border-black"></div>

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="bg-dropdown-logout cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-sm text-primary dark:text-red-400 rounded transition-colors hover:bg-red-300 font-medium"
            >
              <LogOut size={16} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}