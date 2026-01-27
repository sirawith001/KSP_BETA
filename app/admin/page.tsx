'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  wardid: number;
  wardname?: string;
  warduser?: string;
  role?: string;
  [key: string]: any;
}

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'redirect'>('checking');
  const [progress, setProgress] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3.33;
      });
    }, 100);

    // ตรวจสอบ userInfo จาก localStorage
    const savedUserInfo = localStorage.getItem('userInfo');

    if (!savedUserInfo) {
      // ถ้ายังไม่ได้ login -> ไปหน้า login
      console.log('🚪 No user info, redirecting to /');
      setTimeout(() => router.replace('/'), 1500);
      clearInterval(progressInterval);
      return;
    }

    try {
      const user = JSON.parse(savedUserInfo);
      setUserInfo(user);

      // เปลี่ยนเป็น success หลัง 3 วินาที
      setTimeout(() => {
        setStatus('success');
      }, 3000);

      // redirect หลัง 5 วินาที (ให้เห็น success 2 วิ)
      setTimeout(() => {
        setStatus('redirect');
        if (user.role === 'ADMIN') {
          console.log('🛡️ Admin detected, redirecting to /admin');
          router.replace('/admin/dashboard');
        } else {
          console.log('👤 User detected, redirecting to /opd_er/opderaddwork');
          router.replace('/opd_er/opderaddwork');
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Error parsing userInfo:', error);
      setTimeout(() => router.replace('/'), 1500);
    }

    return () => {
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-193 bg-gradient-to-br from-black via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {status === 'checking' ? (
            <>
              {/* Checking Status */}
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  กำลังตรวจสอบสิทธิ์...
                </h2>
                <p className="text-gray-600">
                  กรุณารอสักครู่
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Dots Animation */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </>
          ) : status === 'success' ? (
            <>
              {/* Success Status */}
              <div className="mb-6">
                {/* Success Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-pulse">
                  <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  ✅ ตรวจสอบสิทธิ์สำเร็จ!
                </h2>
                <p className="text-gray-600 text-lg">
                  คุณมีสิทธิ์เข้าใช้งานระบบ
                </p>
              </div>

              {/* Success Animation */}
              <div className="flex justify-center mb-4">
                <div className="w-full bg-green-100 rounded-lg p-4">
                  <p className="text-green-700 font-semibold text-lg">
                    🎉 ยินดีต้อนรับ
                  </p>
                  {userInfo?.warduser && (
                    <p className="text-green-600 mt-2">
                      {userInfo.warduser}
                    </p>
                  )}
                  {userInfo?.wardname && (
                    <p className="text-green-600 text-sm mt-1">
                      ({userInfo.wardname})
                    </p>
                  )}
                </div>
              </div>

              {/* Redirect Info */}
              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </>
          ) : (
            <>
              {/* Redirecting Status */}
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  กำลังเปลี่ยนเส้นทาง...
                </h2>
                <p className="text-gray-600">
                  กรุณารอสักครู่
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-gray-500 text-sm mt-4">
          {status === 'checking' 
            ? 'กำลังยืนยันตัวตน...' 
            : status === 'success'
            ? 'เข้าสู่ระบบสำเร็จ'
            : 'กำลังพาคุณไปหน้าหลัก...'}
        </p>
      </div>
    </div>
  );
}