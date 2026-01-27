'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNotifyPage() {
  const router = useRouter();
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetWardId: 'ALL',
    type: 'INFO'
  });

  // State สำหรับเก็บรายชื่อ Ward และสถานะ
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await fetch('/api/ward-notification');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setWards(data);
          } else {
            setWards([]); 
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setWards([]);
      }
    };
    fetchWards();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            senderId: 1 
        }),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ title: '', message: '', targetWardId: 'ALL', type: 'INFO' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND: Dark Stone/Camo vibe
    <div className="min-h-screen  text-stone-300 p-6 font-mono flex items-center justify-center">
      
      {/* CARD CONTAINER: Tactical Box style */}
      <div className="w-full max-w-2xl bg-stone-800 border-4 border-stone-700 shadow-2xl p-8 relative">
        
        {/* DECORATIVE: Screws/Rivets corners */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-stone-600 rounded-full"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-stone-600 rounded-full"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-stone-600 rounded-full"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-stone-600 rounded-full"></div>

        <h1 className="text-3xl font-black mb-8 text-green-500 uppercase tracking-widest border-b-2 border-stone-600 pb-4 flex items-center gap-3">
          <span className="text-4xl">🎖️</span> Notification
        </h1>

        {/* STATUS ALERT */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-900/50 border-l-4 border-green-500 text-green-400">
            <p className="font-bold tracking-wider">✅ MISSION ACCOMPLISHED: Notification Sent.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 text-red-400">
            <p className="font-bold tracking-wider">❌ ERROR: Transmission Failed. Retry.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. TARGET */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
              Target Designation (ผู้รับ)
            </label>
            <select
              name="targetWardId"
              value={formData.targetWardId}
              onChange={handleChange}
              className="w-full p-3 bg-stone-900 border-2 border-stone-600 text-green-400 focus:border-green-500 focus:outline-none focus:ring-0 transition-colors uppercase"
            >
              <option value="ALL">📢 ALL UNITS (ส่งหาทุกคน)</option>
              <optgroup label="SPECIFIC SECTOR">
                {wards?.map((ward) => (
                    <option key={ward.wardid} value={ward.wardid}>
                        🏢 SECTOR: {ward.wardname || ward.warduser}
                    </option>
                    ))}
                </optgroup>
            </select>
          </div>

          {/* 2. PRIORITY LEVEL */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
              Priority Level (ระดับความสำคัญ)
            </label>
            <div className="flex gap-4 p-4 bg-stone-900 border-2 border-stone-600">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" name="type" value="INFO" 
                  checked={formData.type === 'INFO'} onChange={handleChange}
                  className="appearance-none w-4 h-4 border-2 border-stone-500 rounded-sm checked:bg-green-500 checked:border-green-500"
                />
                <span className={`font-bold tracking-wider group-hover:text-green-400 ${formData.type === 'INFO' ? 'text-green-500' : 'text-stone-500'}`}>
                  INFO (ข่าวสาร)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" name="type" value="URGENT" 
                  checked={formData.type === 'URGENT'} onChange={handleChange}
                  className="appearance-none w-4 h-4 border-2 border-stone-500 rounded-sm checked:bg-red-600 checked:border-red-600"
                />
                <span className={`font-bold tracking-wider group-hover:text-red-400 ${formData.type === 'URGENT' ? 'text-red-500' : 'text-stone-500'}`}>
                  DEFCON 1 (ด่วนมาก)
                </span>
              </label>
            </div>
          </div>

          {/* 3. SUBJECT */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
              Title (หัวข้อ)
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="ENTER Title..."
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 bg-stone-900 border-2 border-stone-600 text-stone-200 placeholder-stone-600 focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>

          {/* 4. BRIEFING */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
              Message (รายละเอียด)
            </label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="CLASSIFIED INFORMATION..."
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3 bg-stone-900 border-2 border-stone-600 text-stone-200 placeholder-stone-600 focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 font-black uppercase tracking-[0.2em] border-b-4 transition-all active:border-b-0 active:translate-y-1
              ${loading 
                ? 'bg-stone-700 border-stone-900 text-stone-500 cursor-not-allowed' 
                : 'bg-green-700 border-green-900 text-stone-100 hover:bg-green-600 hover:shadow-[0_0_15px_rgba(21,128,61,0.5)]'
              }`}
          >
            {loading ? 'TRANSMITTING...' : '🚀 EXECUTE ORDER'}
          </button>

        </form>
      </div>
    </div>
  );
}