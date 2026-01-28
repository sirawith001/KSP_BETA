'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// เรียกใช้ Library Excel
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Interfaces ---
interface UserInfo {
  wardid: number;
  wardname?: string;
  warduser?: string;
  [key: string]: any;
}

interface Category {
  catid: number;
  catname: string;
}

interface WorkAdd {
  wid: number;
  catid: number;
  wardid: number;
  wdates: string;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  wa1?: number; wa11?: number; wa2?: number; wa22?: number;
  wdc1?: number; wdc11?: number; wdc2?: number; wdc22?: number;
  wdc3?: number; wdc33?: number; wdc4?: number; wdc44?: number;
  wdc5?: number; wdc55?: number; wdc6?: number; wdc66?: number;
  wdc7?: number; wdc77?: number;
  wn1?: number; wrn1?: number; wrn2?: number; wpn1?: number;
  wpn2?: number; wna1?: number; wna2?: number;
  [key: string]: any; 
}

interface DisplayDateInfo {
  d: string;
  m: string;
  y: string;
}

// State สำหรับ Modal แก้ไขแบบเจาะจง
interface EditTarget {
    item: WorkAdd;      
    field: string;      
    bracketField?: string; 
    label: string;      
}

// ----------------------------------------------------------------------
// 1. RenderCell (มีปุ่มแก้ไขเฉพาะช่อง)
// ----------------------------------------------------------------------
const RenderCell = ({ 
    item, 
    field, 
    bracketField, 
    label, 
    onEdit 
}: { 
    item: WorkAdd, 
    field: string, 
    bracketField?: string, 
    label: string,
    onEdit: (target: EditTarget) => void 
}) => {
  const value = item[field] as number || 0;
  const bracketValue = bracketField ? (item[bracketField] as number || 0) : null;
  const displayBracket = bracketField ? `(${bracketValue})` : '';

  // กำหนดสีตาม field
  const getColorClass = (fieldName: string) => {
    const colorMap: {[key: string]: string} = {
      'ws1': 'text-ws1',
      'ws2': 'text-ws2 ', 
      'ws3': 'text-ws3',
      'ws4': 'text-ws4',
      'ws5': 'text-ws5',
      'ws6': 'text-ws6',
      'ws7': 'text-ws7',
      'ws8': 'text-ws8',
      'ws9': 'text-ws9',
      'ws10': 'text-ws10',
      'wa1': 'text-wa1',
      'wa11': 'text-wa11',
      'wa2': 'text-wa2',
      'wa22': 'text-wa22',
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

  const mainColor = getColorClass(field);
  const bracketColor = bracketField ? getColorClass(bracketField) : 'text-gray-600';

  return (
    <div className="flex items-center justify-center group whitespace-nowrap relative">
      <span className={`${mainColor} font-bold`}>{value}</span>
      <span className={`${bracketColor} font-semibold`}>{displayBracket}</span>
      
      {/* ปุ่มแก้ไข */}
      <button 
        onClick={() => onEdit({ item, field, bracketField, label })} 
        className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs  rounded-lg font-bold shadow-md transform hover:scale-110 transition-all duration-200"
        title={`แก้ไข ${label}`}
      >
        ✏️
      </button>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function RptAllSumPage() {
  const router = useRouter();
  
  // State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Display Info
  const [displayDateInfo, setDisplayDateInfo] = useState<DisplayDateInfo>({ d: '-', m: '-', y: '-' });

  // Modal State
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState<number>(0);         
  const [editBracketValue, setEditBracketValue] = useState<number>(0); 

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); 

  // 1. Init & Session Check
  useEffect(() => {
    const checkSession = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) { router.replace('/login'); return; }
      const user = JSON.parse(savedUserInfo);
      if (!user.wardname && !user.warduser) { router.replace('/login'); return; }
      setUserInfo(user);
      try {
        const catRes = await fetch('/api/workcat');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);
      } catch (err) { console.error('Error fetching categories', err); }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [workAdds, rowsPerPage, selectedDate]);

  // 2. Search Function
  const handleSearch = async () => {
    if (!userInfo) return;
    if (!selectedMonth || !selectedYear) {
        alert("กรุณาเลือก เดือน และ ปี");
        return;
    }
    fetchData();
  };

  const fetchData = async () => {
    if (!userInfo) return;

    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      const dayStr = selectedDate ? selectedDate.padStart(2, '0') : ''; 
      const dateQuery = dayStr ? `${gregYear}-${selectedMonth.padStart(2, '0')}-${dayStr}` : '';

      const params = new URLSearchParams({
        wardid: userInfo.wardid.toString(),
        date_full: dateQuery, 
        month: selectedMonth, 
        year: gregYear.toString()
      });
      
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkAdds(data.data);
        setDisplayDateInfo({
          d: selectedDate || 'ทุกวัน',
          m: getThaiMonthName(parseInt(selectedMonth)),
          y: selectedYear
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  }
  
  // 3. Open Modal & Save
  const handleOpenEdit = (target: EditTarget) => {
    // เลื่อนแบบทันที
    window.scrollTo({ top: 250, behavior: 'smooth' });
    
    setEditTarget(target);
    setEditValue(target.item[target.field] || 0);
    if (target.bracketField) {
        setEditBracketValue(target.item[target.bracketField] || 0);
    }
};

  const handleCloseModal = () => { setEditTarget(null); };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const updatedItem = { ...editTarget.item, [editTarget.field]: editValue };
    if (editTarget.bracketField) updatedItem[editTarget.bracketField] = editBracketValue;

    try {
      const response = await fetch(`/api/workadd/${editTarget.item.wid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      const data = await response.json();
      if (data.success) {
        handleCloseModal();
        fetchData(); 
      } else { alert(data.error || 'เกิดข้อผิดพลาดในการบันทึก'); }
    } catch (error) { console.error('Error updating:', error); alert('เกิดข้อผิดพลาดในการบันทึก'); }
  };

  // 🔥 4. Export Excel Function (แก้ไข: เอาช่องผู้ช่วยเหลือออก) 🔥
  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
        alert("ไม่พบข้อมูลที่จะ Export");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // --- 1. Setup Columns (กำหนดความกว้าง) ---
    worksheet.columns = [
        { width: 10 }, { width: 15 }, // A, B
        { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, // C-G
        { width: 10 }, // H (Sum)
        { width: 8 }, { width: 8 }, // I-J
        { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, // K-Q
        { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, // R-X (Staff)
        { width: 15 } // Y (Date)
    ];

    // --- 2. Title Row (Row 1) ---
    // แก้จาก X1 เป็น Y1 เพื่อให้ Title ยาวคลุมตารางทั้งหมด
    worksheet.mergeCells('A1:Y1'); 
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `สรุปยอดภาระงานประจำวันหอผู้ป่วย [ ${getDisplayWardName()} ]`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // --- 3. Create Header Structure (ขยับลงมาเป็น Row 2-4) ---
    
    // Header Row 1 (ตอนนี้อยู่ที่ Row 2)
    // ขยับเลขแถวลง 1 เลข (เช่น A1->A2, A3->A4)
    worksheet.mergeCells('A2:A4'); worksheet.getCell('A2').value = 'เวร';
    worksheet.mergeCells('B2:B4'); worksheet.getCell('B2').value = 'ตึก';
    worksheet.mergeCells('C2:G2'); worksheet.getCell('C2').value = 'ระดับความรุนแรงผู้ป่วย';
    worksheet.mergeCells('H2:H4'); worksheet.getCell('H2').value = 'รวม';
    worksheet.mergeCells('I2:J2'); worksheet.getCell('I2').value = 'Admit';
    worksheet.mergeCells('K2:Q2'); worksheet.getCell('K2').value = 'D/C';
    worksheet.mergeCells('R2:X2'); worksheet.getCell('R2').value = 'อัตรากำลังพล';
    worksheet.mergeCells('Y2:Y4'); worksheet.getCell('Y2').value = 'วันที่-วดป.';

    // Header Row 2 (ตอนนี้อยู่ที่ Row 3)
    worksheet.mergeCells('C3:C4'); worksheet.getCell('C3').value = 'ระดับ1';
    worksheet.mergeCells('D3:D4'); worksheet.getCell('D3').value = 'ระดับ2';
    worksheet.mergeCells('E3:E4'); worksheet.getCell('E3').value = 'ระดับ3';
    worksheet.mergeCells('F3:F4'); worksheet.getCell('F3').value = 'ระดับ4';
    worksheet.mergeCells('G3:G4'); worksheet.getCell('G3').value = 'ระดับ5';
    worksheet.mergeCells('I3:I4'); worksheet.getCell('I3').value = 'รับใหม่';
    worksheet.mergeCells('J3:J4'); worksheet.getCell('J3').value = 'รับย้าย';
    worksheet.mergeCells('K3:L3'); worksheet.getCell('K3').value = 'ย้ายไป';
    worksheet.mergeCells('M3:M4'); worksheet.getCell('M3').value = 'จำหน่าย';
    worksheet.mergeCells('N3:N4'); worksheet.getCell('N3').value = 'Refer';
    worksheet.mergeCells('O3:O4'); worksheet.getCell('O3').value = 'ไม่สมัครใจรักษา';
    worksheet.mergeCells('P3:P4'); worksheet.getCell('P3').value = 'หนี';
    worksheet.mergeCells('Q3:Q4'); worksheet.getCell('Q3').value = 'เสียชีวิต';
    worksheet.mergeCells('R3:R4'); worksheet.getCell('R3').value = 'Head ward';
    worksheet.mergeCells('S3:T3'); worksheet.getCell('S3').value = 'RN';
    worksheet.mergeCells('U3:V3'); worksheet.getCell('U3').value = 'PN';
    worksheet.mergeCells('W3:X3'); worksheet.getCell('W3').value = 'NA';

    // Header Row 3 (Sub-headers - ตอนนี้อยู่ที่ Row 4)
    worksheet.getCell('K4').value = 'ward';
    worksheet.getCell('L4').value = 'ICU';
    worksheet.getCell('S4').value = 'ปกติ';
    worksheet.getCell('T4').value = 'เสริม';
    worksheet.getCell('U4').value = 'ปกติ';
    worksheet.getCell('V4').value = 'เสริม';
    worksheet.getCell('W4').value = 'ปกติ';
    worksheet.getCell('X4').value = 'เสริม';

    // Style Header (Update Cell References)
    // เพิ่ม List ที่ต้องใส่ Style โดยขยับ Row +1 ให้หมด
    const headerCells = [
        'A2', 'B2', 'C2', 'H2', 'I2', 'K2', 'R2', 'Y2', 
        'C3', 'D3', 'E3', 'F3', 'G3', 'I3', 'J3', 'K3', 'M3', 'N3', 'O3', 'P3', 'Q3', 'R3', 'S3', 'U3', 'W3', 
        'K4', 'L4', 'S4', 'T4', 'U4', 'V4', 'W4', 'X4'
    ];

    headerCells.forEach(cell => {
        const c = worksheet.getCell(cell);
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- 4. Add Data ---
    // ข้อมูลจะเริ่มต่อท้าย Row 4 (คือเริ่มที่ Row 5) โดยอัตโนมัติเมื่อใช้ addRow
    filteredData.forEach(item => {
       // ... (ส่วน logic การคำนวณ data คงเดิมไม่ต้องแก้) ...
       const catName = categories.find(c => c.catid === item.catid)?.catname || '-';
       const wardName = getDisplayWardName();
       const sumFront = (item.ws1||0) + (item.ws2||0) + (item.ws3||0) + (item.ws4||0) + (item.ws5||0);
       const sumBack = (item.ws6||0) + (item.ws7||0) + (item.ws8||0) + (item.ws9||0) + (item.ws10||0);
       
     
      const fmt = (v?: number, b?: number) => {
          if (b !== undefined && b !== null) return `${v || 0}(${b})`;
          return `${v || 0}`;
      };

       const row = worksheet.addRow([
           catName, 
           wardName,
           fmt(item.ws1, item.ws6),
           fmt(item.ws2, item.ws7),
           fmt(item.ws3, item.ws8),
           fmt(item.ws4, item.ws9),
           fmt(item.ws5, item.ws10),
           `${sumFront}(${sumBack})`,
           fmt(item.wa1, item.wa11),
           fmt(item.wa2, item.wa22),
           fmt(item.wdc1, item.wdc11), 
           fmt(item.wdc4, item.wdc44), 
           fmt(item.wdc2, item.wdc22),
           fmt(item.wdc3, item.wdc33),
           fmt(item.wdc5, item.wdc55),
           fmt(item.wdc6, item.wdc66),
           fmt(item.wdc7, item.wdc77),
           item.wn1 || 0,
           item.wrn1 || 0,
           item.wrn2 || 0,
           item.wpn1 || 0,
           item.wpn2 || 0,
           item.wna1 || 0,
           item.wna2 || 0,
           new Date(item.wdates).toLocaleDateString('en-GB')
       ]);

       row.eachCell((cell) => {
           cell.alignment = { vertical: 'middle', horizontal: 'center' };
           cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
       });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `รายงานภาระงาน_${getDisplayWardName()}_${displayDateInfo.d}_${displayDateInfo.m}_${displayDateInfo.y}.xlsx`);
};

  const getThaiMonthName = (monthIndex: number) => {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[monthIndex - 1] || '-';
  };
  const getDisplayWardName = () => userInfo?.wardname || userInfo?.warduser || '-';

  // 🔥 Client-side Filtering
  const filteredData = workAdds.filter(item => {
    if (!selectedDate) return true;
    const itemDate = new Date(item.wdates);
    const targetDay = parseInt(selectedDate);
    return itemDate.getDate() === targetDay;
  });

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = rowsPerPage === -1 ? filteredData : filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(filteredData.length / rowsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div className="p-10 text-center font-bold">...กำลังตรวจสอบข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gradient-page p-4 font-sans text-primary opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- Header Control Responsive --- */}
        <div className="text-center mb-6 px-2 md:px-0">
          
          {/* Title: ปรับขนาดตัวอักษรตามหน้าจอ */}
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-primary">
            สรุปยอดภาระงานประจำวันหอผู้ป่วย [ {getDisplayWardName()} ]
          </h1>

          <div className="flex justify-center items-center">
            {/* Main Container: Mobile = Column / Desktop = Row */}
            <div className="bg-filter-section flex flex-col md:flex-row items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 rounded-xl border border-blue-200 shadow-md w-full md:w-auto max-w-4xl mx-auto">
              
              {/* 1. Label Section: Icon + Text */}
              <div className="flex items-center gap-2 self-start md:self-center mb-2 md:mb-0">
                <div className="p-1.5 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-primary whitespace-nowrap text-base">วันที่บันทึก</span>
              </div>

              {/* 2. Inputs Group: Grid on Mobile / Flex on Desktop */}
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
                
                {/* Day Select */}
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full md:w-auto bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">วันที่</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>

                {/* Month Select */}
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full md:w-auto bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">เดือน</option>
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                    <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}-{m}</option>
                  ))}
                </select>

                {/* Year Select: Span 2 cols on mobile (full width) */}
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-2 md:col-span-1 w-full md:w-auto bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">ปี พ.ศ. [ค.ศ.]</option>
                  {Array.from({ length: 30 }, (_, i) => {
                    const thYear = 2572 - i;
                    const enYear = thYear - 543;
                    return <option key={thYear} value={thYear}>{thYear}-[{enYear}]</option>;
                  })}
                </select>
              </div>

              {/* 3. Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
                <button 
                  onClick={handleSearch} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg flex-1 md:flex-none justify-center bg-white text-gray-800 border-2 border-red-400 rounded-lg px-4 py-2 text-sm font-bold hover:bg-red-50 hover:border-red-500 hover:text-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm"
                >
                  ตกลง
                </button>
                
                <button 
                  onClick={handleExportExcel} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg flex-none bg-green-600 text-white p-2 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center"
                  title="Export Excel"
                > 
                  <img src="/EXCEL.png" alt="excel" className='w-6 h-6 object-contain' /> 
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- Title & Info --- */}
        {displayDateInfo.y !== '-' && (
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold inline-block mr-2">
                    สรุปยอดภาระงาน {displayDateInfo.d === 'ทุกวัน' ? 'ประจำเดือน' : `วันที่ ${displayDateInfo.d}`} {displayDateInfo.m} พ.ศ. {displayDateInfo.y}
                </h2>
                <div className="text-sm text-gray-500 mt-1">
                   พบข้อมูล <span className="font-bold text-blue-600">{filteredData.length}</span> รายการ
                </div>
            </div>
        )}

        {/* Pagination */}
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

        {/* --- Table --- */}
        <div className="overflow-x-auto border-t-2 border-black min-h-[300px]">
          <table className="w-full text-xs text-black border-collapse border border-black">
            <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
                <tr>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">เวร</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">ตึก</th>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                  <th rowSpan={3} className="bg-gradient-row5 border-2 border-indigo-400/50 px-2 py-3 min-w-[50px] bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">รวม</th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                  <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
                  <th colSpan={7} className="bg-gradient-row4 bg-gradient-to-r from-amber-600 to-red-500 border-2 border-amber-400/50 px-2 py-3 shadow-lg">อัตรากำลังผล</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">วันที่-วดป.</th>
                
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
                  <th rowSpan={2} className="border border-gray-400 px-2 py-2 font-normal bg-blue-100 text-gray-800">Head <br /> Ward</th>
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
                <tr><td colSpan={28} className="border border-black p-8 text-center bg-gray-100 text-gray-500 font-bold ">ไม่พบข้อมูลสำหรับวันที่เลือก</td></tr>
              ) : (
                currentRows.map((item, index) => {
                  const sumFront = (item.ws1||0) + (item.ws2||0) + (item.ws3||0) + (item.ws4||0) + (item.ws5||0);
                  const sumBack = (item.ws6||0) + (item.ws7||0) + (item.ws8||0) + (item.ws9||0) + (item.ws10||0);
                  const rowColor = index % 2 === 0 ? 'bg-[#F8F8FF]' : 'bg-[#F0FFFF]';

                  return (
                    <tr key={item.wid} className={`${rowColor} hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration`}>
                      <td className="border border-black px-2 py-4 text-center font-bold">{categories.find(c => c.catid === item.catid)?.catname || '-'}</td>
                      <td className="font-bold border border-black px-2 py-2 text-center whitespace-nowrap">{getDisplayWardName()}</td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="ws1" bracketField="ws6" label="ระดับ 1" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="ws2" bracketField="ws7" label="ระดับ 2" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="ws3" bracketField="ws8" label="ระดับ 3" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="ws4" bracketField="ws9" label="ระดับ 4" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="ws5" bracketField="ws10" label="ระดับ 5" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center  bg-blue-100 text-ws1-5">{sumFront}({sumBack})</td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wa1" bracketField="wa11" label="รับใหม่" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wa2" bracketField="wa22" label="รับย้าย" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wdc1" bracketField="wdc11" label="ย้ายไป Ward" onEdit={handleOpenEdit} /></td> 
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wdc4" bracketField="wdc44" label="ย้ายไป ICU" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wdc2" bracketField="wdc22" label="จำหน่าย" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wdc3" bracketField="wdc33" label="Refer" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wdc5" bracketField="wdc55" label="ไม่สมัครใจฯ" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center bg-red-50"><RenderCell item={item} field="wdc6" bracketField="wdc66" label="หนี" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center bg-gray-200"><RenderCell item={item} field="wdc7" bracketField="wdc77" label="เสียชีวิต" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center bg-blue-100"><RenderCell item={item} field="wn1" label="Head Ward" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wrn1" label="RN ปกติ" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wrn2" label="RN เสริม" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wpn1" label="PN ปกติ" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wpn2" label="PN เสริม" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wna1" label="NA ปกติ" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center"><RenderCell item={item} field="wna2" label="NA เสริม" onEdit={handleOpenEdit} /></td>
                      <td className="font-bold border border-black px-2 py-2 text-center whitespace-nowrap text-[11px]">{new Date(item.wdates).toLocaleDateString('en-GB')}</td>
                    </tr>
                  );
                })
              )}
               <tr><td colSpan={28} className="bg-[#CCCCCC] h-8 border-t border-black"></td></tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Bottom */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 border rounded hover:bg-gray-300 disabled:opacity-50">&lt; ก่อนหน้า</button>
                <div className="flex gap-1 items-center"><span className="font-bold">หน้า {currentPage} จาก {totalPages}</span></div>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 border rounded hover:bg-gray-300 disabled:opacity-50">ถัดไป &gt;</button>
            </div>
        )}

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