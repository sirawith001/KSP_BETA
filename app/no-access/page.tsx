'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldBan, AlertOctagon, LogOut, Lock } from 'lucide-react';

export default function NoAccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [incidentId, setIncidentId] = useState('');

  useEffect(() => {
    // นับถอยหลัง
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto redirect หลัง 5 วินาที
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [router]);

  return (
    // Background: Dark Gray with Red Alert tint
    <div className="min-h-screen flex items-center justify-center bg-[#101010] p-4 font-mono relative overflow-hidden">
      
      {/* Background Grid/Noise Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
      
      {/* Red Pulse Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-red-900/10 animate-pulse"></div>

      {/* Main Card */}
      <div className="bg-[#1c1c1e] p-1 border-2 border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full relative z-10">
        
        {/* Inner Border Container */}
        <div className="border border-red-900/50 p-8 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          
          {/* Top Warning Stripe */}
          <div className="flex items-center justify-between mb-8 border-b border-red-900 pb-2">
             <span className="text-[10px] text-red-600 tracking-[0.2em]">SECURITY PROTOCOL</span>
             <span className="text-[10px] text-red-600 tracking-[0.2em]">CODE: 403</span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 animate-pulse"></div>
              <div className="bg-[#2a1515] rounded-sm border border-red-700 p-6 relative">
                <ShieldBan className="w-16 h-16 text-red-600" strokeWidth={1.5} />
              </div>
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500"></div>
            </div>
          </div>

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 text-center uppercase tracking-tighter">
            Access <span className="text-red-600">Denied</span>
          </h1>

          {/* Message */}
          <div className="bg-red-950/30 border-l-2 border-red-600 p-3 mb-6">
            <p className="text-red-200 text-sm text-center leading-relaxed uppercase tracking-wide">
              Unauthorized personnel detected.<br/>
              You do not have clearance for this sector.
            </p>
          </div>

          {/* Countdown System */}
          <div className="bg-[#0a0a0a] border border-gray-800 p-4 mb-6 text-center relative group">
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest">
              Terminating Session In
            </p>
            <div className="flex items-end justify-center gap-2">
               <span className="text-5xl font-bold text-red-600 font-mono tabular-nums leading-none">
                 00:0{countdown}
               </span>
               <span className="text-xs text-red-800 mb-1">SEC</span>
            </div>
            {/* Loading Bar */}
            <div className="w-full h-1 bg-gray-800 mt-3 overflow-hidden">
               <div 
                 className="h-full bg-red-700 transition-all duration-1000 ease-linear"
                 style={{ width: `${(countdown / 5) * 100}%` }}
               ></div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold text-sm px-6 py-4 uppercase tracking-wider transition-all duration-200 shadow-lg border border-red-600 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Abort & Return to Login
          </button>

          {/* Footer Code */}
          <div className="mt-6 pt-4 border-t border-red-900/30 text-center">
             <p className="text-[10px] text-gray-600 uppercase">
               Incident ID: {incidentId || 'GENERATING...'}
             </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}