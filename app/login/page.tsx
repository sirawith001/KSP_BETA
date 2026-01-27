'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [warduser, setWarduser] = useState('');
  const [wardpass, setWardpass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ ตรวจสอบว่า login แล้วหรือยัง
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    
    if (savedUserInfo) {
      try {
        const user = JSON.parse(savedUserInfo);
        
        // ถ้า login แล้ว redirect ไปหน้าที่เหมาะสม
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/user');
        }
      } catch (error) {
        console.error('Error parsing userInfo:', error);
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login Attempt (WardUser)');
      console.log('warduser:', warduser);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warduser, wardpass }),
      });

      const data = await response.json();
      console.log('📡 Login API response:', data);

      if (!response.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      if (!data.token || !data.user) {
        setError('ข้อมูล response ไม่ถูกต้อง');
        return;
      }

      // Save token
      localStorage.setItem('token', data.token);

      // Save user info
      const userInfo = {
        wardid: data.user.wardid,
        warduser: data.user.warduser,
        wardname: data.user.wardname,
        role: data.user.role,
      };

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('💾 UserInfo saved:', userInfo);

      // ✅ แยก Greeting และ Redirect ตาม Role
      if (data.user.role === 'ADMIN') {
        console.log('🚀 Redirecting to /admin');
        alert(`🎉 ยินดีต้อนรับ Admin ${data.user.warduser}!`);
        
        // ใช้ replace แทน push เพื่อไม่ให้กลับมาหน้า login ได้
        router.replace('/admin');
        
      } else {
        console.log('🚀 Redirecting to /user');
        alert(`ยินดีต้อนรับ ${data.user.warduser}! 🎉`);
        
        router.replace('/user');
      }

    } catch (error) {
      console.error('❌ Login Error:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl p-8">

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">เข้าสู่ระบบ</h1>
            <p className="text-gray-400">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* WARDUSER */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                ชื่อผู้ใช้ (warduser)
              </label>
              <input
                type="text"
                value={warduser}
                onChange={(e) => setWarduser(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                placeholder="เช่น ward5a"
              />
            </div>

            {/* WARDPASS */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                รหัสผ่าน (wardpass)
              </label>
              <input
                type="password"
                value={wardpass}
                onChange={(e) => setWardpass(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-red-500/50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}