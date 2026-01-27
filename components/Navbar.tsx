'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ป้องกัน hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // ใช้ localStorage เฉพาะเมื่อ component mount แล้ว
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setUserName(user.name || 'User');
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      }
    }
  }, [mounted]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setUserName('');
    setShowUserMenu(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'ข้อมูลภาระงาน' },
    { href: '/project', label: 'แก้ไขสรุปข้อมูลภาระงานรายวัน' },
    { href: '/contact', label: 'สรุปข้อมูลภาระงานรายเดือน' },
    { href: '/aboutus', label: 'ตารางสรุปภาระงานรายเดือน'},
  ];

  // ไม่แสดงใน admin page
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // ไม่ render จนกว่า client จะพร้อม
  if (!mounted) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-lg border-b border-red-500/30 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/50 transition-all duration-300 transform group-hover:scale-110">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
              
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            ))}
          </div>

          {/* CTA Button / User Menu (Desktop) */}
          <div className="hidden md:block">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 text-white font-medium rounded-lg hover:border-red-500 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <span>{userName}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl backdrop-blur-md bg-black/95 border border-red-500/30 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-red-500/20">
                      <p className="text-sm text-gray-400">เข้าสู่ระบบในฐานะ</p>
                      <p className="font-semibold text-white">{userName}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        โปรไฟล์
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        แดชบอร์ด
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        ตั้งค่า
                      </Link>
                    </div>
                    <div className="border-t border-red-500/20 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-2.5 text-gray-300 hover:text-white font-medium transition-colors duration-300"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="group relative px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">สมัครสมาชิก</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-red-500/10 transition-colors duration-300"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2 bg-black/95 backdrop-blur-lg border-b border-red-500/30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
            >
              {link.label}
            </Link>
          ))}
          
          {isLoggedIn ? (
            <>
              <div className="pt-2 border-t border-red-500/20">
                <div className="flex items-center gap-3 px-4 py-3 text-gray-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium">{userName}</span>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
              >
                โปรไฟล์
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
              >
                แดชบอร์ด
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
              >
                ตั้งค่า
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-red-500/10 rounded-lg font-medium transition-all duration-300"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-center bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}