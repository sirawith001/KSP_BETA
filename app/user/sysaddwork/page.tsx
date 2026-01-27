
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal'

// --- Interfaces ---

interface UserInfo {
  wardid: number;
  wardname?: string;
  warduser?: string;
  wardstatus?: string;
  warddest?: string;
  [key: string]: any;
}

interface Category {
  catid: number;
  catname: string;
}

interface WorkAdd {
  wid: number;
  wardid: number;
  catid: number;
  wdates: string;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  wa1?: number; wa2?: number;
  wa11?: number; wa22?: number;
  wdc1?: number; wdc2?: number; wdc3?: number; wdc4?: number; wdc5?: number;
  wdc11?: number; wdc22?: number; wdc33?: number; wdc44?: number; wdc55?: number;
  wdc6?: number; wdc66?: number;
  wdc7?: number; wdc77?: number;
  wn1?: number;
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
  ward_note?: string;
  [key: string]: any;
}

interface FormData {
  ws1: number; ws2: number; ws3: number; ws4: number; ws5: number;
  wa1: number; wa2: number;
  wdc1: number; wdc2: number; wdc3: number; wdc4: number; wdc5: number;
  wn1: number;
  wdc6: number;
  wdc7: number;
  ws6: number; ws7: number; ws8: number; ws9: number; ws10: number;
  wa11: number; wa22: number;
  wdc11: number; wdc22: number; wdc33: number; wdc44: number; wdc55: number;
  wdc66: number;
  wdc77: number;
  wrn1: number; wrn2: number;
  wpn1: number; wpn2: number;
  wna1: number; wna2: number;
  ward_note: string;
  [key: string]: any;
}

export default function SysAddWorkPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWardName, setLoadingWardName] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  const [formData, setFormData] = useState<FormData>({
    ws1: 0, ws2: 0, ws3: 0, ws4: 0, ws5: 0,
    ws6: 0, ws7: 0, ws8: 0, ws9: 0, ws10: 0,
    wa1: 0, wa2: 0,
    wa11: 0, wa22: 0,
    wdc1: 0, wdc2: 0, wdc3: 0, wdc4: 0, wdc5: 0,
    wdc11: 0, wdc22: 0, wdc33: 0, wdc44: 0, wdc55: 0,
    wn1: 0,
    wdc6: 0, wdc66: 0,
    wdc7: 0, wdc77: 0,
    wrn1: 0, wrn2: 0,
    wpn1: 0, wpn2: 0,
    wna1: 0, wna2: 0,
    ward_note: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    
  }, []);

  // 1. Fetch User Info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) {
        router.replace('/login');
        return;
      }
      const user = JSON.parse(savedUserInfo);
      setUserInfo(user);
      setLoading(false);

      if (!user.wardid) {
        setLoadingWardName(false);
        return;
      }

      try {
        const url = `/api/warduser/${user.wardid}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data) {
          const updatedUser = {
            ...user,
            wardname: data.data.wardname || '',
            wardstatus: data.data.wardstatus,
            warddest: data.data.warddest
          };
          setUserInfo(updatedUser);
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('❌ Error fetching ward info:', error);
      } finally {
        setLoadingWardName(false);
      }
    };
    fetchUserInfo();
  }, [router]);

  // 2. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/workcat');
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // 3. Fetch Data Table
  useEffect(() => {
    if (userInfo) {
      fetchWorkAdds();
    }
  }, [userInfo, selectedDate, selectedMonth, selectedYear, selectedCat]);

  const handleClearFilters = () => {
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedCat('');
  };

  const fetchWorkAdds = async () => {
    if (!userInfo) return;
    try {
      const params = new URLSearchParams({
        wardid: userInfo.wardid.toString(),
      });
      if (selectedCat) params.append('catid', selectedCat);
      if (selectedYear && selectedMonth) {
        const buddhYear = parseInt(selectedYear);
        const gregYear = buddhYear - 543;
        params.append('year', gregYear.toString());
        params.append('month', selectedMonth);
        if (selectedDate) params.append('date', selectedDate);
      }
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      if (data.success) {
        setWorkAdds(data.data);
      }
    } catch (error) {
      console.error('Error fetching work adds:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const calculateTotal = (data: WorkAdd | FormData) => {
    return (
      (data.ws1 || 0) + (data.ws2 || 0) + (data.ws3 || 0) + (data.ws4 || 0) + (data.ws5 || 0) +
      (data.ws6 || 0) + (data.ws7 || 0) + (data.ws8 || 0) + (data.ws9 || 0) + (data.ws10 || 0)
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      ws1: 0, ws2: 0, ws3: 0, ws4: 0, ws5: 0,
      ws6: 0, ws7: 0, ws8: 0, ws9: 0, ws10: 0,
      wa1: 0, wa2: 0,
      wa11: 0, wa22: 0,
      wdc1: 0, wdc2: 0, wdc3: 0, wdc4: 0, wdc5: 0,
      wdc11: 0, wdc22: 0, wdc33: 0, wdc44: 0, wdc55: 0,
      wn1: 0,
      wdc6: 0, wdc66: 0,
      wdc7: 0, wdc77: 0,
      wrn1: 0, wrn2: 0,
      wpn1: 0, wpn2: 0,
      wna1: 0, wna2: 0,
      ward_note: '',
    });
  };

  const handleSave = async () => {
    if (!userInfo) return;

    if (!selectedDate || !selectedMonth || !selectedYear || !selectedCat) {
      alert('กรุณาเลือก วันที่, เดือน, ปี และช่วงเวลา (เวร) ให้ครบถ้วน');
      return;
    }

    setSaveLoading(true);

    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      const dateStr = `${gregYear}-${selectedMonth.padStart(2, '0')}-${selectedDate.padStart(2, '0')}`;

      const payload = {
        ...formData,
        wardid: userInfo.wardid,
        catid: parseInt(selectedCat),
        wdates: dateStr,
      };

      const url = editingId ? `/api/workadd/${editingId}` : '/api/workadd';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingId ? 'บันทึกการแก้ไขเรียบร้อย' : 'บันทึกข้อมูลเรียบร้อย');
        resetForm();
        fetchWorkAdds();
      } else {
        if (data.error && data.error.includes('Unique constraint')) {
          alert('ไม่สามารถบันทึกได้: มีข้อมูลของเวรนี้ในวันนี้อยู่แล้ว (ข้อมูลซ้ำ)');
        } else {
          alert(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (workAdd: WorkAdd) => {
    // เลื่อนหน้าจอไปที่ตำแหน่ง 400 ก่อน
    window.scrollTo({ top: 400, behavior: 'smooth' });
    
    // รอ scroll เสร็จ (300-500ms) แล้วค่อย set ข้อมูล
    setTimeout(() => {
        setEditingId(workAdd.wid);
        setFormData({
            ws1: workAdd.ws1 || 0, ws2: workAdd.ws2 || 0, ws3: workAdd.ws3 || 0, ws4: workAdd.ws4 || 0, ws5: workAdd.ws5 || 0,
            ws6: workAdd.ws6 || 0, ws7: workAdd.ws7 || 0, ws8: workAdd.ws8 || 0, ws9: workAdd.ws9 || 0, ws10: workAdd.ws10 || 0,
            wa1: workAdd.wa1 || 0, wa2: workAdd.wa2 || 0,
            wa11: workAdd.wa11 || 0, wa22: workAdd.wa22 || 0,
            wdc1: workAdd.wdc1 || 0, wdc2: workAdd.wdc2 || 0, wdc3: workAdd.wdc3 || 0,
            wdc11: workAdd.wdc11 || 0, wdc22: workAdd.wdc22 || 0, wdc33: workAdd.wdc33 || 0,
            wdc4: workAdd.wdc4 || 0, wdc44: workAdd.wdc44 || 0,
            wdc5: workAdd.wdc5 || 0, wdc55: workAdd.wdc55 || 0,
            wn1: workAdd.wn1 || 0,
            wdc6: workAdd.wdc6 || 0, wdc66: workAdd.wdc66 || 0,
            wdc7: workAdd.wdc7 || 0, wdc77: workAdd.wdc77 || 0,
            wrn1: workAdd.wrn1 || 0, wrn2: workAdd.wrn2 || 0,
            wpn1: workAdd.wpn1 || 0, wpn2: workAdd.wpn2 || 0,
            wna1: workAdd.wna1 || 0, wna2: workAdd.wna2 || 0,
            ward_note: workAdd.ward_note || '',
        });

        const dateObj = new Date(workAdd.wdates);
        setSelectedDate(dateObj.getDate().toString());
        setSelectedMonth((dateObj.getMonth() + 1).toString());
        setSelectedYear((dateObj.getFullYear() + 543).toString());
        setSelectedCat(workAdd.catid.toString());
    }, 400); // รอ 400ms ให้ scroll animation เสร็จ
};

  const handleDelete = async (wid: number) => {
    if (!userInfo) return;
    try {
      const response = await fetch(`/api/workadd/${wid}?wardid=${userInfo.wardid}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        alert('ลบข้อมูลสำเร็จ');
        setShowDeleteConfirm(null);
        if (editingId === wid) resetForm();
        fetchWorkAdds();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const getDisplayWardName = () => {
    if (loadingWardName) return '...';
    if (userInfo?.wardname) return userInfo.wardname;
    return userInfo?.warduser || '-';
  };

  const renderSingleInput = (field: string) => (
    <div className="flex flex-col items-center justify-center p-0.5 w-[40px] shrink-0">
      <input
        type="number"
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 text-center rounded-lg font-semibold text-gray-800 h-9 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
        min="0"
      />
    </div>
  );

  const renderDoubleInput = (topField: string, bottomField: string | null) => (
    <div className="flex flex-col items-center justify-center gap-1.5 p-1 w-[56px] shrink-0">
      <input
        type="number"
        value={formData[topField] ?? 0}
        onChange={(e) => handleInputChange(topField, e.target.value)}
        className="w-full h-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200 shadow-sm"
        min="0"
      />

      <div className="flex items-center text-xs text-gray-600 w-full justify-center">
        <span className="text-gray-400">(</span>
        {bottomField ? (
          <input
            type="number"
            value={formData[bottomField] ?? 0}
            onChange={(e) => handleInputChange(bottomField, e.target.value)}
            className="w-full h-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 text-xs font-semibold text-gray-700 focus:bg-white focus:border-purple-400 focus:outline-none mx-0.5 rounded transition-all duration-200"
            min="0"
          />
        ) : (
          <span className="w-full text-center text-gray-300">-</span>
        )}
        <span className="text-gray-400">)</span>
      </div>
    </div>
  );

  const filteredData = workAdds; 

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);



  if (!mounted) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-page p-4 font-sans opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header - Modern Gradient */}
        <div className="bg-filter-section rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-primary">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <h1 className="text-3xl font-bold">{getDisplayWardName()}</h1>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border-2 ">
              <div className="text-center">
                <div className="text-xs text-primary mb-1">วันที่บันทึก</div>
                <div className="text-2xl font-bold text-primary">
                  {selectedDate && selectedMonth && selectedYear ? `${selectedDate}/${selectedMonth}/${selectedYear}` : 'ยังไม่ได้เลือก'}
                </div>
              </div>
            </div>
          </div>
        </div>

       {/* Filters - Glass Morphism Responsive */}
        <div className="bg-filter-section backdrop-blur-lg rounded-2xl p-4 md:p-6 mb-6 shadow-xl border border-white/50">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-4">
            
            {/* --- ส่วนที่ 1: เลือกวันที่ --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-filter-section px-4 py-3 rounded-xl border border-blue-200 dark:border-military-600 shadow-sm w-full lg:w-auto">
              {/* Label Icon */}
              <div className="flex items-center gap-2 mb-2 sm:mb-0 min-w-fit">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="font-bold whitespace-nowrap text-primary">วันที่ <span className="text-red-500">*</span></label>
              </div>
              
              {/* Date Selectors Group: Grid on Mobile, Flex on Desktop */}
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                {/* Day */}
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 sm:w-20 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">วันที่</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}</option>)}
                </select>

                {/* Month - Full width on very small screens if needed, or share grid */}
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 sm:w-32 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">เดือน</option>
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((monthName, index) => {
                    const value = index + 1;
                    return <option key={value} value={value}>{value.toString().padStart(2, '0')}-{monthName}</option>;
                  })}
                </select>

                {/* Year - Span 2 cols on mobile grid so it doesn't float awkwardly */}
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-2 sm:col-span-1 sm:w-28 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">ปี พ.ศ.</option>
                  {Array.from({ length: 15 }, (_, i) => {
                    const thYear = 2569 - i;
                    const enYear = thYear - 543;
                    return <option key={thYear} value={thYear}>{thYear} [{enYear}]</option>;
                  })}
                </select>
              </div>
            </div>

            {/* --- ส่วนที่ 2: เลือกเวร --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-xl border border-purple-200 shadow-sm bg-filter-section w-full lg:w-auto">
              <div className="flex items-center gap-2 mb-2 sm:mb-0 min-w-fit">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label className="font-bold text-primary whitespace-nowrap">เวร <span className="text-red-500">*</span></label>
              </div>
              <select 
                value={selectedCat} 
                onChange={(e) => setSelectedCat(e.target.value)} 
                className={`duration-500 hover:-translate-y-1 hover:shadow-lg w-full sm:w-48 text-gray-800 border-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer shadow-sm ${selectedCat === '' ? 'border-red-400 bg-red-50' : 'bg-white border-purple-300'} focus:outline-none focus:ring-2 focus:ring-purple-200 hover:bg-red-100 hover:text-black`}
              >
                <option value="">-- กรุณาเลือก --</option>
                {categories.map(cat => <option key={cat.catid} value={cat.catid}>{cat.catname}</option>)}
              </select>
            </div>

            {/* --- ส่วนที่ 3: ปุ่มล้างค่า --- */}
            <button 
              onClick={handleClearFilters}
              className="duration-500 hover:-translate-y-1 flex items-center justify-center gap-2 bg-gradient-header hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl font-bold transition-all  shadow-lg hover:shadow-xl  active:scale-95 w-full lg:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="whitespace-nowrap">ล้างค่า</span>
            </button>
          </div>
        </div>

        {/* Form Table - Modern Card */}
        <div className=" backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/50 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 via-lime-600 to-green-600 rounded-full"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-lime-600 to-green-600 bg-clip-text text-transparent text-primary ">บันทึกข้อมูล</h2>
            </div>
            {editingId && (
              <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-xl border-2 border-orange-300 animate-pulse">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-orange-700 font-bold">กำลังแก้ไขข้อมูล</span>
                <button onClick={resetForm} className="text-sm underline text-orange-600 hover:text-orange-800 font-semibold ">ยกเลิก</button>
              </div>
            )}
          </div>

          <div className=" rounded-xl p-4 border border-blue-200 overflow-x-auto">
            <table className="w-full text-sm text-black border-collapse">
              <thead className="text-center font-bold text-white text-xs md:text-sm">
                <tr>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-300 px-2 py-3 rounded-tl-lg text-white font-semibold shadow-lg">
                    ระดับความรุนแรงผู้ป่วย
                  </th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-300 px-2 py-3 text-white font-semibold shadow-lg">
                    Admit
                  </th>
                  <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-300 px-2 py-3 text-white font-semibold shadow-lg">
                    D/C
                  </th>
                  <th colSpan={7} className="bg-gradient-row4 bg-gradient-to-r from-amber-600 to-red-500 border-2 border-amber-300 px-2 py-3 rounded-tr-lg text-white font-semibold shadow-lg">
                    อัตรากำลังผล
                  </th>
                </tr>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ระดับ1</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ระดับ2</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ระดับ3</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ระดับ4</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ระดับ5</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">รับใหม่</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">รับย้าย</th>
                  <th colSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">ย้ายไป</th>
                  <th rowSpan={2} className="border-2 border-gray-300 py-2 text-gray-700">จำหน่าย</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">Refer</th>
                  <th rowSpan={2} className="border-2 border-gray-300 py-2 text-gray-700">ไม่สมัคร<br />ใจรักษา</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700">หนี</th>
                  <th rowSpan={2} className="border-2 border-gray-300 py-2 text-gray-700">เสียชีวิต</th>
                  <th rowSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-blue-100">Ward <br /> Head</th>
                  <th colSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-blue-100">RN</th>
                  <th colSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-green-100">PN</th>
                  <th colSpan={2} className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-orange-100">NA</th>
                </tr>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <th className="border-2 border-gray-300 px-2 py-2 min-w-[50px] text-gray-700">Ward</th>
                  <th className="border-2 border-gray-300 px-2 py-2 min-w-[50px] text-gray-700">ICU</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-blue-50">ปกติ</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-blue-50">เสริม</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-green-50">ปกติ</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-green-50">เสริม</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-orange-50">ปกติ</th>
                  <th className="border-2 border-gray-300 px-2 py-2 text-gray-700 bg-orange-50">เสริม</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white/80 backdrop-blur-sm align-top">
                  <td className="border-2 border-gray-300">{renderDoubleInput('ws1', 'ws6')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('ws2', 'ws7')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('ws3', 'ws8')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('ws4', 'ws9')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('ws5', 'ws10')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wa1', 'wa11')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wa2', 'wa22')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc1', 'wdc11')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc4', 'wdc44')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc2', 'wdc22')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc3', 'wdc33')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc5', 'wdc55')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc6', 'wdc66')}</td>
                  <td className="border-2 border-gray-300">{renderDoubleInput('wdc7', 'wdc77')}</td>
                  <td className="border-2 border-gray-300 p-2 align-middle">{renderSingleInput('wn1')}</td>
                  {['wrn1', 'wrn2', 'wpn1', 'wpn2', 'wna1', 'wna2'].map(f => (
                    <td key={f} className="border-2 border-gray-300 p-2 align-middle">{renderSingleInput(f)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold shadow-lg transform transition-all duration-300 text-white ${
                editingId 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 bg-gradient-header' 
                  : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 bg-gradient-header'
              } hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saveLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
                </>
              )}
            </button>
            {editingId && (
              <button 
                onClick={resetForm} 
                className="flex items-center  gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ยกเลิก
              </button>
            )}
          </div>
        </div>

        {/* --- Pagination Responsive --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4 no-print">
          
          {/* 1. Rows Per Page Selector */}
          <div className="w-full md:w-auto flex justify-center items-center gap-3 text-primary backdrop-blur-lg px-4 py-2 rounded-xl shadow-sm border border-gray-200 bg-white/50">
            <span className="text-sm font-semibold whitespace-nowrap">แสดง</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => setRowsPerPage(parseInt(e.target.value))} 
              className="border-2 border-gray-300 rounded-lg px-3 py-1 bg-white font-semibold text-gray-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>ทั้งหมด</option>
            </select>
            <span className="text-sm font-semibold whitespace-nowrap">รายการ</span>
          </div>

          {/* 2. Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-2 backdrop-blur-lg px-2 py-2 rounded-xl shadow-sm border border-gray-200 bg-white/50">
              
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="px-3 py-1.5 text-primary rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                ← <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <span className="text-sm font-bold text-primary whitespace-nowrap px-2">
                หน้า {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1.5 text-primary rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                <span className="hidden sm:inline">ถัดไป</span> →
              </button>
              
            </div>
          )}
        </div>

        {/* History Table - Modern Design */}
        <div className=" backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/50 overflow-x-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 via-lime-600 to-green-600 rounded-full"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-lime-600 to-green-600 bg-clip-text text-transparent text-primary">ประวัติการบันทึก</h2>
          </div>
          
          <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
            <table className="w-full text-xs text-black border-collapse">
              <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
                <tr>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[80px] bg-gradient-to-br from-slate-600 to-slate-700">เวร</th>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                  <th rowSpan={3} className="border-2 border-indigo-400/50 px-2 py-3 min-w-[50px] bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">รวม</th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                  <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
                  <th colSpan={7} className="bg-gradient-row4 bg-gradient-to-r from-amber-600 to-red-500 border-2 border-amber-400/50 px-2 py-3 shadow-lg">อัตรากำลังผล</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">วันที่-วดป.</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[60px] bg-gradient-to-br from-slate-600 to-slate-700">ลบ</th>
                </tr>
                <tr>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ระดับ1</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ระดับ2</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ระดับ3</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ระดับ4</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ระดับ5</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">รับใหม่</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">รับย้าย</th>
                  <th colSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ย้ายไป</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">จำหน่าย</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">Refer</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ไม่สมัครใจ</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">หนี</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">เสียชีวิต</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-blue-100 text-gray-800">Ward <br /> Head</th>
                  <th colSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-blue-100 text-gray-800">RN</th>
                  <th colSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-green-100 text-gray-800">PN</th>
                  <th colSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-orange-100 text-gray-800">NA</th>
                </tr>
                <tr>
                  <th className="border border-gray-400 px-2 py-2 font-normal">Ward</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal">ICU</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-blue-50 text-gray-800">ปกติ</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-blue-50 text-gray-800">เสริม</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-green-50 text-gray-800">ปกติ</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-green-50 text-gray-800">เสริม</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-orange-50 text-gray-800">ปกติ</th>
                  <th className="border border-gray-400 px-2 py-2 font-normal bg-orange-50 text-gray-800">เสริม</th>
                </tr>
              </thead>

              <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={26} className="border border-gray-300 px-4 py-12 text-center bg-white">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-semibold text-lg">ไม่มีข้อมูล</p>
                      <p className="text-gray-400 text-sm">กรุณาบันทึกข้อมูลใหม่</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map((item, index) => (
                  <tr 
                    key={item.wid} 
                    className={`${
                      index % 2 === 0 
                        ? 'bg-white' 
                        : 'bg-white'
                    } hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration-200`}
                  >
                    <td className="border border-gray-300 px-2 py-3 text-center font-bold whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-800">{categories.find(c => c.catid === item.catid)?.catname || '-'}</span>
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs px-2 py-1 rounded-lg font-bold shadow-md transform hover:scale-110 transition-all duration-200"
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-ws1">{item.ws1}</span>
                      <span className="font-bold text-ws6">({item.ws6 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-ws2">{item.ws2}</span>
                      <span className="font-bold text-ws7">({item.ws7 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-ws3">{item.ws3}</span>
                      <span className="font-bold text-ws8">({item.ws8 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-ws4">{item.ws4}</span>
                      <span className="font-bold text-ws9">({item.ws9 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-ws5">{item.ws5}</span>
                      <span className="font-bold text-ws10">({item.ws10 || 0})</span>
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-center font-bold bg-blue-100">
                      <span className="text-ws1-5 font-bold">
                        {(item.ws1 || 0) + (item.ws2 || 0) + (item.ws3 || 0) + (item.ws4 || 0) + (item.ws5 || 0)}
                      </span>
                      <span className=" font-bold text-ws6-10">
                        ({(item.ws6 || 0) + (item.ws7 || 0) + (item.ws8 || 0) + (item.ws9 || 0) + (item.ws10 || 0)})
                      </span>
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wa1">{item.wa1}</span>
                      <span className="font-bold text-wa11">({item.wa11 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wa2">{item.wa2}</span>
                      <span className="font-bold text-wa22">({item.wa22 || 0})</span>
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wdc1">{item.wdc1}</span>
                      <span className="font-bold text-wdc11">({item.wdc11 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wdc4">{item.wdc4}</span>
                      <span className="font-bold text-wdc44">({item.wdc44 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wdc2">{item.wdc2}</span>
                      <span className="font-bold text-wdc22">({item.wdc22 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wdc3">{item.wdc3}</span>
                      <span className="font-bold text-wdc33">({item.wdc33 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <span className="font-bold text-wdc5">{item.wdc5}</span>
                      <span className="font-bold text-wdc55">({item.wdc55 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center bg-red-50">
                      <span className="font-bold text-wdc6">{item.wdc6}</span>
                      <span className="font-bold text-wdc66">({item.wdc66 || 0})</span>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center bg-gray-200">
                      <span className="font-bold text-wdc7">{item.wdc7}</span>
                      <span className="font-bold ttext-wdc77">({item.wdc77 || 0})</span>
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wn1 bg-blue-100">{item.wn1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wrn1">{item.wrn1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wrn2">{item.wrn2}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wpn1">{item.wpn1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wpn2">{item.wpn2}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wna1">{item.wna1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center font-bold text-wna2">{item.wna2}</td>

                    <td className="border border-gray-300 px-2 py-2 text-center text-xs whitespace-nowrap font-semibold text-gray-700">
                      {new Date(item.wdates).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {showDeleteConfirm === item.wid ? (
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => handleDelete(item.wid)} 
                            className="text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg font-bold shadow-md transform hover:scale-105 transition-all"
                          >
                            ยืนยัน
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(null)} 
                            className="text-xs bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-3 py-1 rounded-lg font-bold shadow-md transform hover:scale-105 transition-all"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowDeleteConfirm(item.wid)} className="text-red-500 hover:text-red-700 font-bold">❌</button>
                        )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
            </table>

          </div>
        </div>
            <DeleteConfirmModal 
  isOpen={showDeleteConfirm !== null}
  onClose={() => setShowDeleteConfirm(null)} 
  onConfirm={() => {
    if (showDeleteConfirm !== null) {
      handleDelete(showDeleteConfirm); // ตอนนี้ TS จะรู้แล้วว่าข้างในนี้ไม่ใช่ null แน่นอน
      setShowDeleteConfirm(null);
    }
  }} 
/>
      </div>
      
    </div>
    
  );
}