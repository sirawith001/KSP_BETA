'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  totalWards: number;
  activeWards: number;
  todayWorkRecords: number;
  pendingRecords: number;
  notifications: number;
  recentActivities: Array<{
    id: number;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-2xl p-8 text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-8 text-center">
        <p className="text-yellow-400 text-lg">ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Card */}
      <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          🛡️ แดชบอร์ดผู้ดูแลระบบ
        </h2>
        <p className="text-gray-400 text-lg">
          ภาพรวมของระบบและข้อมูลสำคัญ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">ผู้ใช้ทั้งหมด</span>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalUsers}</p>
          <p className="text-gray-400 text-sm">ผู้ใช้งานในระบบ</p>
        </div>

        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">หอผู้ป่วย</span>
            <span className="text-3xl">🏥</span>
          </div>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalWards}</p>
          <p className="text-blue-400 text-sm">{stats.activeWards} ใช้งานอยู่</p>
        </div>

        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">งานวันนี้</span>
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-4xl font-bold text-white mb-2">{stats.todayWorkRecords}</p>
          <p className="text-yellow-400 text-sm">{stats.pendingRecords} รอดำเนินการ</p>
        </div>

        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">แจ้งเตือน</span>
            <span className="text-3xl">🔔</span>
          </div>
          <p className="text-4xl font-bold text-white mb-2">{stats.notifications}</p>
          <p className="text-red-400 text-sm">
            {stats.notifications > 0 ? `${stats.notifications} รายการต้องตรวจสอบ` : 'ไม่มีรายการแจ้งเตือน'}
          </p>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <button
          onClick={() => navigateTo('/adminmini/sysaddworkadmin')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">👥</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">ข้อมูลภาระงานคนไข้ใน</h4>
              <p className="text-gray-400 text-sm">จัดการข้อมูลผู้ป่วยใน</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/adminmini/rptallsumadmin')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">🏥</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">สรุปข้อมูลภาระงาน</h4>
              <p className="text-gray-400 text-sm">รายงานสรุปภาระงาน</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/adminmini/rptshowmatchAdminNew')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">📊</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">ตารางสรุปภาระงาน</h4>
              <p className="text-gray-400 text-sm">แสดงตารางข้อมูล</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/adminmini/opderrptallsumadmin')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">สรุปข้อมูลผู้ป่วยนอก</h4>
              <p className="text-gray-400 text-sm">รายงานผู้ป่วยนอก</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/adminmini/rptallsumadminReport')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">💾</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">รายงานเหตุการณ์</h4>
              <p className="text-gray-400 text-sm">งานบริการพยาบาล</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigateTo('/admin/notification')}
          className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:border-red-500 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white text-2xl">⚙️</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">แจ้งเตือน</h4>
              <p className="text-gray-400 text-sm">ส่งประกาศ</p>
            </div>
          </div>
        </button>

      </div>

      {/* Recent Activities */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">กิจกรรมล่าสุด</h3>
          <div className="space-y-3">
            {stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-gray-400 text-sm">โดย {activity.user}</p>
                </div>
                <span className="text-gray-500 text-sm">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}