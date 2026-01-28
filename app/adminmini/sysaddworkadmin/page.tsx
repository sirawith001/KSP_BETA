'use client';
import { useState, useEffect } from 'react';

// ==================== 1. Interfaces ====================

interface UserInfo {
  role: string;
  wardid?: number;
  [key: string]: any;
}

interface Category {
  catid: number;
  catname: string;
}

interface Ward {
  wardid: number;
  wardname: string;
  warduser: string;
}

interface WorkAdd {
  wid: number;
  catid: number;
  wardid: number;
  wdates: string;
  [key: string]: any; // Allow indexing
}

// Interface สำหรับระบุว่ากำลังแก้ไขช่องไหน
interface EditTargetState {
  item: WorkAdd;
  fieldMain: string;      // เช่น 'ws1'
  bracketField?: string;  // เช่น 'ws6' (ถ้ามี)
  label: string;          // ชื่อไทย เช่น 'ระดับ 1'
}

// ==================== 2. Component ====================

export default function AdminAllReportPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  // Search State
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Display Info
  const [displayDateInfo, setDisplayDateInfo] = useState({ d: '-', m: '-', y: '-' });
  const [displayWardName, setDisplayWardName] = useState('-');
  const [displayShiftName, setDisplayShiftName] = useState('-');
  
  // ===== NEW EDIT STATE (แก้ไขเฉพาะจุด) =====
  const [editTarget, setEditTarget] = useState<EditTargetState | null>(null);
  const [editValue, setEditValue] = useState<number>(0);         // ค่าหลัก
  const [editBracketValue, setEditBracketValue] = useState<number>(0); // ค่าในวงเล็บ

  useEffect(() => {
    const initPage = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) { window.location.href = '/login'; return; }
      const user = JSON.parse(savedUserInfo);
      
      if (user.role !== 'ADMIN') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = '/';
        return;
      }
      setUserInfo(user);

      try {
        const [catRes, wardRes] = await Promise.all([
            fetch('/api/workcat').then(r => r.json()),
            fetch('/api/warduser').then(r => r.json())
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (wardRes.success) {
           // กรองเอาเฉพาะ ID ที่ไม่ใช่ 45 และ 50
           const cleanWards = wardRes.data.filter((w: Ward) =>  w.wardid !== 7 && w.wardid !== 9 && w.wardid !== 10 && w.wardid !== 11);
           setWards(cleanWards);
        }
      } catch (err) { console.error(err); }

      setLoading(false);
    };
    initPage();
  }, []);

  const handleSearch = async () => {
    if (!userInfo) return;
    if (!selectedWardId || !selectedCatId || !selectedDate || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือก หอผู้ป่วย, เวร, วันที่, เดือน และ ปี ให้ครบถ้วน");
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      const params = new URLSearchParams({
        wardid: selectedWardId, catid: selectedCatId,
        date: selectedDate, month: selectedMonth, year: gregYear.toString(),
      });
      
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkAdds(data.data);
        setDisplayDateInfo({ d: selectedDate, m: getThaiMonthName(parseInt(selectedMonth)), y: selectedYear });
        
        const selectedWard = wards.find(w => w.wardid === parseInt(selectedWardId));
        setDisplayWardName(selectedWard?.wardname || selectedWard?.warduser || '-');

        const selectedCat = categories.find(c => c.catid === parseInt(selectedCatId));
        setDisplayShiftName(selectedCat?.catname || '-');
      }
    } catch (error) { console.error('Error fetching report:', error); }
  };

  const handleDelete = async (wid: number) => {
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
        const response = await fetch(`/api/workadd/${wid}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) fetchData();
        else alert(data.error || 'ไม่สามารถลบข้อมูลได้');
    } catch (error) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
  };

  // ===== NEW EDIT FUNCTIONS =====
  
  const openEditModal = (item: WorkAdd, fieldMain: string, fieldSec: string | undefined, label: string) => {
    window.scrollTo({ top: 250, behavior: 'smooth' });
    setEditTarget({ item, fieldMain, bracketField: fieldSec, label });
    setEditValue(item[fieldMain] || 0);
    setEditBracketValue(fieldSec ? (item[fieldSec] || 0) : 0);
  };

  const handleCloseModal = () => {
    setEditTarget(null);
    setEditValue(0);
    setEditBracketValue(0);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;

    const payload: any = {
        [editTarget.fieldMain]: editValue
    };
    if (editTarget.bracketField) {
        payload[editTarget.bracketField] = editBracketValue;
    }

    try {
      const updatedItem = { ...editTarget.item, ...payload };
      
      const response = await fetch(`/api/workadd/${editTarget.item.wid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });

      const data = await response.json();

      if (data.success) {
        setWorkAdds(prev => prev.map(item => 
            item.wid === editTarget.item.wid ? updatedItem : item
        ));
        handleCloseModal();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const getThaiMonthName = (monthIndex: number) => {
    const months = [ 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม' ];
    return months[monthIndex - 1] || '-';
  };

  const calculateTotal = (data: WorkAdd) => {
    const sumMain = (data.ws1 || 0) + (data.ws2 || 0) + (data.ws3 || 0) + (data.ws4 || 0) + (data.ws5 || 0);
    const sumSec = (data.ws6 || 0) + (data.ws7 || 0) + (data.ws8 || 0) + (data.ws9 || 0) + (data.ws10 || 0);
    return { main: sumMain, sec: sumSec };
  };

  // ==================== RenderCell (UPDATED: ปุ่มไม่ซ้อน) ====================
  interface RenderCellProps {
    item: WorkAdd;
    fieldMain: string;
    fieldSec?: string;
    label: string;
    isTotal?: boolean;
  }

  const RenderCell = ({ item, fieldMain, fieldSec, label, isTotal = false }: RenderCellProps) => {
    const valMain = item[fieldMain] as number || 0;
    const valSec = fieldSec ? (item[fieldSec] as number || 0) : 0;

    // ฟังก์ชันกำหนดสีแต่ละ field
    const getColorClass = (fieldName: string) => {
      const colorMap: {[key: string]: string} = {
        // ระดับความรุนแรง - ค่าหลัก
        'ws1': 'text-ws1',
        'ws2': 'text-ws2', 
        'ws3': 'text-ws3',
        'ws4': 'text-ws4',
        'ws5': 'text-ws5',
        // ระดับความรุนแรง - วงเล็บ
        'ws6': 'text-ws6',
        'ws7': 'text-ws7',
        'ws8': 'text-ws8',
        'ws9': 'text-ws9',
        'ws10': 'text-ws10',
        // Admit
        'wa1': 'text-wn1',
        'wa11': 'text-wa11',
        'wa2': 'text-wa2',
        'wa22': 'text-wa22',
        // D/C
        'wdc1': 'text-wdc1',
        'wdc11': 'text-wdc11',
        'wdc2': 'text-wdc2',
        'wdc22': 'text-wdc22',
        'wdc3': 'text-wdc3',
        'wdc33': 'text-wdc33',
        'wdc4': 'text-wdc4',
        'wdc44': 'text-wdc44',
        'wdc5': 'text-wdc5',
        'wdc55': 'text-wdc55',
        'wdc6': 'text-wdc6',
        'wdc66': 'text-wdc66',
        'wdc7': 'text-wdc7',
        'wdc77': 'text-wdc77',
        // อัตรากำลัง
        'wn1': 'text-wn1',
        'wrn1': 'text-wrn1',
        'wrn2': 'text-wrn2',
        'wpn1': 'text-wpn1',
        'wpn2': 'text-wpn2',
        'wna1': 'text-wna1',
        'wna2': 'text-wna2'
      };
      return colorMap[fieldName] || 'text-black';
    };

    const mainColor = getColorClass(fieldMain);
    const bracketColor = fieldSec ? getColorClass(fieldSec) : 'text-gray-600';

    return (
      <div className="flex items-center justify-center group whitespace-nowrap px-1 ">
        {/* ค่าหลัก - สีตาม field */}
        <span className={`font-bold ${valMain >= 0 ? mainColor : "text-gray-400"}`}>
          {valMain}
        </span>

        {/* ค่าในวงเล็บ - สีตาม field (แยกอิสระ) */}
        {fieldSec && (
          <span className={`text-[12px] font-semibold ${valSec >= 0 ? bracketColor : "text-gray-400"}`}>
            ({valSec})
          </span>
        )}

        {/* ปุ่มแก้ไข */}
        {!isTotal && (
            <button
            onClick={() => openEditModal(item, fieldMain, fieldSec, label)}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs rounded-lg font-bold shadow-md transform hover:scale-110 transition-all duration-200"
            title={`แก้ไข ${label}`}
            >
             ✏️
            </button>
        )}
      </div>
    );
  };

  

  return (
    <div className="min-h-screen  p-4 font-sans bg-gradient-page text-primary opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Search Responsive */}
        <div className="text-center mb-6 px-4 md:px-0">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-primary">
            ข้อมูลบันทึกภาระงานของหอผู้ป่วยใน
          </h1>

          <div className="flex justify-center ">
            {/* Main Container: Mobile=Vertical, Desktop=Horizontal */}
            <div className="bg-filter-section flex flex-col lg:flex-row items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-5 rounded-xl border border-blue-200 shadow-md w-full lg:w-auto max-w-5xl">
              
              {/* --- Section 1: Date Selector --- */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {/* Label with Icon */}
                <div className="flex items-center gap-2 mb-1 sm:mb-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-bold text-primary whitespace-nowrap">วันที่</span>
                </div>

                {/* Date Inputs: Grid on Mobile / Flex on Desktop */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto lg:flex lg:items-center">
                  {/* Day */}
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="col-span-1 w-full lg:w-20 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black duration-500 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <option value="">วันที่</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>

                  {/* Month */}
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full lg:w-32 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                  >
                    <option value="">เดือน</option>
                    {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน','กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                      <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}-{m}</option>
                    ))}
                  </select>

                  {/* Year - Full width on mobile grid */}
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)} 
                    className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-2 lg:col-span-1 w-full lg:w-auto bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                  >
                    <option value="">ปี พ.ศ. [ค.ศ.]</option>
                    {Array.from({ length: 30 }, (_, i) => {
                      const thYear = 2572 - i;
                      const enYear = thYear - 543;
                      return <option key={thYear} value={thYear}>{thYear}-[{enYear}]</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* --- Section 2: Ward Selector --- */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="font-bold text-primary whitespace-nowrap mb-1 sm:mb-0 hidden sm:block">หอผู้ป่วย</span>
                <span className="font-bold text-primary whitespace-nowrap mb-1 sm:mb-0 sm:hidden">เลือกหอผู้ป่วย</span>
                <select 
                  value={selectedWardId} 
                  onChange={(e) => setSelectedWardId(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full lg:w-34 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">เลือกหอผู้ป่วย</option>
                  {wards.map(ward => <option key={ward.wardid} value={ward.wardid}>{ward.wardname || ward.warduser}</option>)}
                </select>
              </div>

              {/* --- Section 3: Shift Selector --- */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="font-bold text-primary whitespace-nowrap mb-1 sm:mb-0 hidden sm:block">เวลาเวร</span>
                <span className="font-bold text-primary whitespace-nowrap mb-1 sm:mb-0 sm:hidden">เลือกเวลาเวร</span>
                <select 
                  value={selectedCatId} 
                  onChange={(e) => setSelectedCatId(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full lg:w-26 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">เลือกเวร</option>
                  {categories.map(cat => <option key={cat.catid} value={cat.catid}>{cat.catname}</option>)}
                </select>
              </div>

              {/* --- Section 4: Search Button --- */}
              <button 
                onClick={handleSearch} 
                className="duration-500 hover:-translate-y-1 w-full lg:w-auto bg-gradient-header bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 hover:from-green-700 hover:to-lime-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all  hover:shadow-xl flex items-center justify-center gap-2 mt-2 lg:mt-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                ค้นหา
              </button>

            </div>
          </div>
        </div>

        <div className="text-center mb-4 font-bold">
            วันที่ {displayDateInfo.d} เดือน {displayDateInfo.m} พ.ศ. {displayDateInfo.y} : {displayWardName} ({displayShiftName})
        </div>

        {/* ==================== MAIN TABLE ==================== */}
        <div className="overflow-x-auto border-t-2 border-black">
          <table className="w-full text-xs text-black border-collapse border border-black">
          <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
              <tr>
                <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[30px] bg-gradient-to-br from-slate-600 to-slate-700">เวร</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[55px] bg-gradient-to-br from-slate-600 to-slate-700">ตึก</th>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                  <th rowSpan={3} className="bg-gradient-row5 border-2 border-indigo-400/50 px-2 py-3 min-w-[50px] bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">รวม</th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                  <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
                  <th colSpan={7} className="bg-gradient-row4 bg-gradient-to-r from-amber-600 to-red-500 border-2 border-amber-400/50 px-2 py-3 shadow-lg">อัตรากำลังผล</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[50px] bg-gradient-to-br from-slate-600 to-slate-700">วันที่ <br />วดป.</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[30px] bg-gradient-to-br from-slate-600 to-slate-700">ลบ</th>
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
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">ไม่สมัคร<br />ใจรักษา</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">หนี</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal">เสียชีวิต</th>
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-blue-100 text-gray-800">Head <br /> ward</th>
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
              {workAdds.length === 0 ? (
                <tr><td colSpan={27} className="border border-black px-4 py-8 text-center text-gray-500 bg-white">ไม่พบข้อมูล</td></tr>
              ) : (
                workAdds.map((item, index) => {
                    const totals = calculateTotal(item);
                    return (
                  <tr key={item.wid} className={`${index % 2 === 0 ? 'bg-[#F8F8FF]' : 'bg-[#F0FFFF]'} hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration `}>
                    <td className="border border-black px-2 py-4 text-center font-bold">{categories.find(c => c.catid === item.catid)?.catname || '-'}</td>
                    <td className="border border-black px-2 py-2 text-center font-bold text-black whitespace-nowrap">{displayWardName}</td>
                    
                    {/* Level 1-5 */}
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="ws1" fieldSec="ws6" label="ระดับ 1" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="ws2" fieldSec="ws7" label="ระดับ 2" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="ws3" fieldSec="ws8" label="ระดับ 3" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="ws4" fieldSec="ws9" label="ระดับ 4" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="ws5" fieldSec="ws10" label="ระดับ 5" /></td>
                    
                    {/* Total */}
                    <td className="border border-black px-1 py-1 text-center text-ws1-5 bg-blue-100 font-bold">{totals.main}({totals.sec})</td>
                    
                    {/* Admit */}
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wa1" fieldSec="wa11" label="รับใหม่" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wa2" fieldSec="wa22" label="รับย้าย" /></td>
                    
                    {/* D/C Group */}
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wdc1" fieldSec="wdc11" label="ย้ายไป Ward" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wdc4" fieldSec="wdc44" label="ย้ายไป ICU" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wdc2" fieldSec="wdc22" label="จำหน่าย" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wdc3" fieldSec="wdc33" label="Refer" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wdc5" fieldSec="wdc55" label="ไม่สมัครใจ" /></td>
                    <td className="border border-black px-1 py-1 text-center bg-red-50"><RenderCell item={item} fieldMain="wdc6" fieldSec="wdc66" label="หนี" /></td>
                    <td className="border border-black px-1 py-1 text-center bg-gray-200"><RenderCell item={item} fieldMain="wdc7" fieldSec="wdc77" label="เสียชีวิต" /></td>
                    
                    {/* Head & Staff */}
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wn1" label="Head Ward" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wrn1" label="RN ปกติ" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wrn2" label="RN เสริม" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wpn1" label="PN ปกติ" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wpn2" label="PN เสริม" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wna1" label="NA ปกติ" /></td>
                    <td className="border border-black px-1 py-1 text-center"><RenderCell item={item} fieldMain="wna2" label="NA เสริม" /></td>
                    
                    <td className="border border-black px-1 py-1 text-center text-[10px] whitespace-nowrap">{new Date(item.wdates).toLocaleDateString('en-GB')}</td>
                    <td className="border border-black px-1 py-1 text-center">
                        <button onClick={() => handleDelete(item.wid)} className="text-red-600 font-bold hover:scale-125">❌</button>
                    </td>
                  </tr>
                )})
              )}
              <tr><td colSpan={28} className="bg-[#CCCCCC] h-8 border-t border-black"></td></tr>
            </tbody>
          </table>
        </div>
      

        {/* --- EDIT MODAL (SPECIFIC FIELD) --- */}
        {editTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-800 w-full max-w-sm relative overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-3 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                            <span>✏️</span> แก้ไขค่า
                        </h3>
                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-gray-50 flex flex-col items-center gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">รายการ: <span className="font-bold text-black">{editTarget.label}</span></p>
                            <p className="text-xs text-gray-400">วันที่: {new Date(editTarget.item.wdates).toLocaleDateString('th-TH')}</p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                             {/* ช่องหลัก */}
                             <div className="flex flex-col items-center">
                                <label className="text-xs font-bold text-gray-700 mb-1">ค่าหลัก</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={editValue} 
                                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} 
                                    className="w-20 h-10 border-2 border-blue-500 rounded text-center text-xl font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                             </div>

                             {/* ช่องวงเล็บ (ถ้ามี) */}
                             {editTarget.bracketField && (
                                <>
                                    <span className="text-2xl text-gray-400 mt-4">(</span>
                                    <div className="flex flex-col items-center">
                                        <label className="text-xs font-bold text-gray-700 mb-1">ในวงเล็บ</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={editBracketValue} 
                                            onChange={(e) => setEditBracketValue(parseInt(e.target.value) || 0)} 
                                            className="w-20 h-10 border-2 border-orange-500 rounded text-center text-xl font-bold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <span className="text-2xl text-gray-400 mt-4">)</span>
                                </>
                             )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-200 px-4 py-3 flex justify-between gap-2">
                        <button onClick={handleCloseModal} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-100 transition">
                            ยกเลิก
                        </button>
                        <button onClick={handleSaveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md transition flex justify-center items-center gap-2">
                            <span>💾</span> บันทึก
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}