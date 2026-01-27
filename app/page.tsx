'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Eye, EyeOff, AlertCircle, BookOpen, Shield, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [warduser, setWarduser] = useState('');
  const [wardpass, setWardpass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

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

      localStorage.setItem('token', data.token);

      const userInfo = {
        wardid: data.user.wardid,
        warduser: data.user.warduser,
        wardname: data.user.wardname,
        role: data.user.role,
        department: data.user.department,
      };

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('💾 UserInfo saved:', userInfo);

      // --- ส่วน Redirect Logic (คงเดิม) ---
      if (data.user.role === 'ADMIN') {
        if (data.user.warduser === 'admincm' && data.user.department?.toUpperCase() === 'ADMINMINI') {
             console.log('🚀 Redirecting to /admin (Super Admin Case)');
             alert(`🎉 ยินดีต้อนรับ Admin ใหญ่ ${data.user.warduser}!`);
             setTimeout(() => { router.push('/admin'); router.refresh(); }, 100);
        }
        else if (data.user.department?.toUpperCase() === 'ADMINMINI') {
          console.log('🚀 Redirecting to /adminmini');
          alert(`🎉 ยินดีต้อนรับ Admin Mini ${data.user.warduser}!`);
          setTimeout(() => { router.push('/adminmini'); router.refresh(); }, 100);
        } 
        else {
          console.log('🚀 Redirecting to /admin');
          alert(`🎉 ยินดีต้อนรับ Admin ${data.user.warduser}!`);
          setTimeout(() => { router.push('/admin'); router.refresh(); }, 100);
        }
      } else if (['OPD', 'ER'].includes(data.user.department?.toUpperCase())) {
        console.log('🚀 Redirecting to /opd_er');
        alert(`ยินดีต้อนรับ ${data.user.warduser} (${data.user.department})! 🎉`);
        setTimeout(() => { router.push('/opd_er'); router.refresh(); }, 100);
      } else {
        console.log('🚀 Redirecting to /user');
        alert(`ยินดีต้อนรับ ${data.user.warduser}! 🎉`);
        setTimeout(() => { router.push('/user'); router.refresh(); }, 100);
      }
      // --- จบส่วน Redirect Logic ---

    } catch (error) {
      console.error('❌ Login Error:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-[#2c2c2e] rounded-sm shadow-2xl border-2 border-[#4a5e4a] p-8 relative overflow-hidden">
          
          {/* Decorative: Tactical Stripes */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4a5e4a] via-[#7a8f7a] to-[#4a5e4a]"></div>
          <div className="absolute top-2 right-1 w-16 h-16 border-t-2 border-r-2 border-[#4a5e4a]/30 rounded-tr-lg"></div>
          <div className="absolute bottom-1 left-1 w-16 h-16 border-b-2 border-l-2 border-[#4a5e4a]/30 rounded-bl-lg"></div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-24 h-24 bg-[#1a1a1c] border-2 border-[#4a5e4a] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
              {/* Badge Effect */}
              <div className="absolute inset-0 border border-dashed border-gray-600 rounded-full m-1 opacity-50"></div>
              <img src="LOGOKSP.png" alt="Logo" className="w-full h-full object-contain p-3 drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black text-gray-200 mb-1 uppercase tracking-wider">
              SYSTEM ACCESS
            </h1>
            <p className="text-[#8e9e8e] text-xs font-mono tracking-widest uppercase">
              Hospital Ward Operation Control
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-600 flex items-start gap-3 animate-pulse">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-400 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username Field */}
            <div>
              <label className="block text-[#8e9e8e] text-xs font-bold mb-2 uppercase tracking-wide">
                User (WardUser)
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={warduser}
                  onChange={(e) => setWarduser(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1c] border border-gray-600 text-gray-200 rounded-none focus:border-[#5f7a5f] focus:ring-1 focus:ring-[#5f7a5f] focus:outline-none transition-all placeholder-gray-600 font-mono"
                  placeholder="WardUser..."
                />
                <div className="absolute inset-y-0 right-0 w-1 bg-gray-600 group-focus-within:bg-[#5f7a5f] transition-colors"></div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[#8e9e8e] text-xs font-bold mb-2 uppercase tracking-wide">
                Password (WardPass)
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={wardpass}
                  onChange={(e) => setWardpass(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onKeyUp={handleKeyPress}
                  required
                  className="w-full px-4 py-3 pr-12 bg-[#1a1a1c] border border-gray-600 text-gray-200 rounded-none focus:border-[#5f7a5f] focus:ring-1 focus:ring-[#5f7a5f] focus:outline-none transition-all placeholder-gray-600 font-mono"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-10 w-1 bg-gray-600 group-focus-within:bg-[#5f7a5f] transition-colors"></div>
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#5f7a5f] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Caps Lock Warning */}
              {capsLockOn && (
                <p className="mt-2 text-xs text-amber-500 flex items-center gap-1 font-mono">
                  <AlertCircle size={14} />
                  WARNING: CAPS LOCK ENGAGED
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1c] border border-dashed border-gray-700">
              <Shield className="text-[#5f7a5f] flex-shrink-0" size={16} />
              <p className="text-[10px] text-gray-400 uppercase tracking-tight">
                Warning: Unauthorized access is strictly prohibited. Do not share credentials.
              </p>
            </div>

            {/* Buttons Container */}
            <div className="flex gap-3 pt-2">
              {/* Login Button: Tactical Green */}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#4a5e4a] text-white font-bold uppercase tracking-wider text-sm hover:bg-[#3d4f3d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_0_rgb(30,30,30)] active:shadow-none active:translate-y-[4px] border border-[#5f7a5f]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCcw className="animate-spin" size={16} />
                    AUTHENTICATING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock size={16} />
                    LOGIN
                  </span>
                )}
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setWarduser("");
                  setWardpass("");
                  setError("");
                }}
                className="w-1/3 flex items-center justify-center gap-2 py-3 bg-[#1a1a1c] border border-gray-600 text-gray-400 font-bold uppercase tracking-wider text-sm hover:bg-gray-800 hover:text-white transition-all shadow-[0_4px_0_rgb(0,0,0)] active:shadow-none active:translate-y-[4px]"
              >
                <RefreshCcw size={16} />
                RESET
              </button>
            </div>

          </form>

          {/* Divider */}
          <div className="my-8 flex items-center justify-center">
            <div className="h-px bg-gray-700 w-full"></div>
            <span className="px-3 text-gray-600 text-xs font-mono whitespace-nowrap">SECURE CONNECTION</span>
            <div className="h-px bg-gray-700 w-full"></div>
          </div>

          {/* Help Links */}
          <div className="space-y-3">
            <a 
              href="/static/คู่มือระบบข้อมูลภาระงานหอผู้ป่วย.pdf" 
              target="_blank"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-[#4a5e4a] text-[#8e9e8e] text-sm hover:bg-[#4a5e4a] hover:text-white transition-all uppercase tracking-wide group"
            >
              <BookOpen size={16} className="group-hover:animate-bounce" />
              <span>Operation Manual</span>
            </a>

            <button
              type="button"
              onClick={() => alert('กรุณาติดต่อผู้ดูแลระบบแผนกของคุณ (Contact Admin)')}
              className="w-full text-xs text-gray-500 hover:text-[#5f7a5f] transition-colors font-mono"
            >
              [ LOST CREDENTIALS? CONTACT ADMINISTRATOR ]
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            ID: {new Date().getFullYear()}-SECURE | SYSTEM V.BETA-TEST <br/>
            © HOSPITAL WARD SYSTEM | DEV: SIRAWITH SALAKLAI
          </p>
        </div>

      </div>
    </div>
  );
}