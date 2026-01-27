'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define an interface for the user object
interface UserInfo {
  wardid: number;
  warduser: string;
  role: string;
  wardname?: string;
  wardstatus?: string;
  warddest?: string;
}

// Define an interface for the form data
interface FormData {
  wardname: string;
  wardstatus: string;
  warddest: string;
}

export default function ProfilePage() {
  const router = useRouter();
  
  // Use the UserInfo interface for state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    wardname: '',
    wardstatus: '',
    warddest: '',
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) {
        router.replace('/login');
        return;
      }
      
      try {
        const user: UserInfo = JSON.parse(savedUserInfo);
        
        // Ensure user object has wardid before fetching
        if (user && user.wardid) {
            const response = await fetch(`/api/warduser/${user.wardid}`);
            const data = await response.json();
            
            if (data.success && data.data) {
              setUserInfo(data.data);
              setFormData({
                wardname: data.data.wardname || '',
                wardstatus: data.data.wardstatus || '',
                warddest: data.data.warddest || '',
              });
            } else {
                // Fallback to local storage data if API fails or returns no data
                 setUserInfo(user);
            }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
      
      setLoading(false);
    };
    
    fetchUserInfo();
  }, [router]);

  // Type the parameters for handleInputChange
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!userInfo) return;
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/warduser/${userInfo.wardid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ บันทึกข้อมูลสำเร็จ');
        
        // Update localStorage
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const user: UserInfo = JSON.parse(savedUserInfo);
          user.wardname = formData.wardname;
          user.wardstatus = formData.wardstatus;
          user.warddest = formData.warddest;
          localStorage.setItem('userInfo', JSON.stringify(user));
        }
        
        // Refresh data
        setUserInfo(data.data);
      } else {
        alert('❌ ' + (data.error || 'เกิดข้อผิดพลาด'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-red-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">
              ⚙️ ตั้งค่าโปรไฟล์
            </h1>
            <button
              onClick={handleBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              ← ย้อนกลับ
            </button>
          </div>
          <p className="text-gray-300">
            ผู้ใช้: <span className="text-yellow-400 font-bold">{userInfo?.warduser}</span>
            {' | '}
            สิทธิ์: <span className="text-green-400 font-bold">{userInfo?.role}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-red-900">
          <h2 className="text-xl font-bold text-white mb-6">ข้อมูลหอผู้ป่วย</h2>
          
          <div className="space-y-6">
            {/* Ward Name */}
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                <span className="text-red-400">*</span> ชื่อหอผู้ป่วย
              </label>
              <input
                type="text"
                value={formData.wardname}
                onChange={(e) => handleInputChange('wardname', e.target.value)}
                placeholder="เช่น: หอผู้ป่วยชั้น 3, ICU, ER"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500"
              />
              <p className="text-gray-400 text-sm mt-1">
                💡 ชื่อนี้จะแสดงในหน้าบันทึกข้อมูลผู้ป่วย
              </p>
            </div>

            {/* Ward Status */}
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                สถานะหอผู้ป่วย
              </label>
              <select
                value={formData.wardstatus}
                onChange={(e) => handleInputChange('wardstatus', e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500"
              >
                <option value="">-- เลือกสถานะ --</option>
                <option value="0">ปิดให้บริการ</option>
                <option value="1">เปิดให้บริการ</option>
                <option value="2">ปิดปรับปรุง</option>
                <option value="3">ฉุกเฉิน</option>
              </select>
            </div>

            {/* Ward Destination */}
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">
                จํานวนเตียง
              </label>
              <input
                type="text"
                value={formData.warddest}
                onChange={(e) => handleInputChange('warddest', e.target.value)}
                placeholder=""
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={saving || !formData.wardname}
              className={`px-8 py-3 rounded-lg font-bold transition ${
                saving || !formData.wardname
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 mt-6 border border-blue-700">
          <h3 className="text-blue-300 font-bold mb-2">ℹ️ ข้อมูลเพิ่มเติม</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• <span className="text-red-400">*</span> ชื่อหอผู้ป่วยเป็นข้อมูลบังคับ</li>
            <li>• ข้อมูลจะถูกบันทึกทันทีหลังจากกดปุ่มบันทึก</li>
            <li>• สามารถแก้ไขข้อมูลได้ตลอดเวลา</li>
          </ul>
        </div>
      </div>
    </div>
  );
}