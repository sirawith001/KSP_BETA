'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import types for ExcelJS
import type { FillPattern, Alignment, Borders } from 'exceljs';

// ==================== 1. Interfaces ====================

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
  wid?: number; 
  catid: number;
  wardid?: number;
  wdates: string;
  
  // --- Patient Levels (Main) ---
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  // --- Patient Levels (Ghost/Bracket) ✅ เพิ่ม ---
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;

  // --- Admit (Main) ---
  wa1?: number; wa2?: number;
  // --- Admit (Ghost) ✅ เพิ่ม ---
  wa11?: number; wa22?: number;

  // --- D/C (Main) ---
  wdc1?: number; wdc2?: number; wdc3?: number; wdc4?: number; wdc5?: number;
  wdc6?: number; wdc7?: number;
  // --- D/C (Ghost) ✅ เพิ่ม ---
  wdc11?: number; wdc22?: number; wdc33?: number; 
  wdc44?: number; wdc55?: number; wdc66?: number; wdc77?: number;

  // --- Staff ---
  wn1?: number;
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
  [key: string]: any;
}

// Interface for grouped data (Make all number fields mandatory)
interface GroupedWorkAdd extends WorkAdd {
  ws1: number; ws2: number; ws3: number; ws4: number; ws5: number;
  ws6: number; ws7: number; ws8: number; ws9: number; ws10: number; // ✅
  
  wa1: number; wa2: number;
  wa11: number; wa22: number; // ✅

  wdc1: number; wdc2: number; wdc3: number; wdc4: number; wdc5: number; wdc6: number; wdc7: number;
  wdc11: number; wdc22: number; wdc33: number; wdc44: number; wdc55: number; wdc66: number; wdc77: number; // ✅

  wn1: number;
  wrn1: number; wrn2: number;
  wpn1: number; wpn2: number;
  wna1: number; wna2: number;
}

interface DisplayInfo {
  m: string;
  y: string;
}

// ==================== 2. Component ====================

export default function RptAllSumMonthPage() {
  const router = useRouter();
  
  // Typed State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Display Info
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>({ m: '...', y: '...' });

  // 1. Init Data
  useEffect(() => {
    const initPage = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) {
        router.replace('/login');
        return;
      }
      const user = JSON.parse(savedUserInfo);
      setUserInfo(user);

      try {
        const catRes = await fetch('/api/workcat');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);
      } catch (err) {
        console.error('Error fetching categories', err);
      }

      setLoading(false);
    };
    
    initPage();
  }, [router]);

  // 2. Search Function
  const handleSearch = async () => {
    if (!userInfo) return;

    if (!selectedMonth || !selectedYear) {
        alert("กรุณาเลือก เดือน และ ปี ให้ครบถ้วน");
        return;
    }

    fetchData();
  };

  const fetchData = async () => {
    if (!userInfo) return;

    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      
      const params = new URLSearchParams({
        wardid: userInfo.wardid.toString(),
        month: selectedMonth,
        year: gregYear.toString(),
      });
      
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const targetMonth = parseInt(selectedMonth);
        const targetYear = gregYear;
        
        const filteredData = data.data.filter((item: WorkAdd) => {
          const date = new Date(item.wdates);
          const localYear = date.getFullYear();
          const localMonth = date.getMonth() + 1;
          
          return localYear === targetYear && localMonth === targetMonth;
        });
        
        setWorkAdds(filteredData);
        setDisplayInfo({
          m: getThaiMonthName(parseInt(selectedMonth)),
          y: selectedYear
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  }

  // Helper Functions
  const getThaiMonthName = (monthIndex: number) => {
    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[monthIndex - 1] || '-';
  };

  const getDisplayWardName = () => {
    if (userInfo?.wardname) return userInfo.wardname;
    return userInfo?.warduser || '-';
  };

  // ✅ Grouping Function
  const groupAndSortData = (data: WorkAdd[]): GroupedWorkAdd[] => {
  const grouped: { [key: string]: GroupedWorkAdd } = {};
  
  data.forEach((item, itemIndex) => {
    const date = new Date(item.wdates);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    // ✅ เพิ่ม itemIndex เพื่อไม่ให้รวมเวรซ้ำ
    const shiftKey = `${dateKey}-${item.catid}-${itemIndex}`;
    
    if (!grouped[shiftKey]) {
      grouped[shiftKey] = {
        wid: item.wid,
        wdates: item.wdates,
        catid: item.catid,
        ws1: 0, ws2: 0, ws3: 0, ws4: 0, ws5: 0,
        ws6: 0, ws7: 0, ws8: 0, ws9: 0, ws10: 0,
        wa1: 0, wa2: 0,
        wa11: 0, wa22: 0,
        wdc1: 0, wdc2: 0, wdc3: 0, wdc4: 0, wdc5: 0, wdc6: 0, wdc7: 0,
        wdc11: 0, wdc22: 0, wdc33: 0, wdc44: 0, wdc55: 0, wdc66: 0, wdc77: 0,
        wn1: 0,
        wrn1: 0, wrn2: 0,
        wpn1: 0, wpn2: 0,
        wna1: 0, wna2: 0
      };
    }
    
    const current = grouped[shiftKey];
    
    // Level Main
    current.ws1 += (item.ws1 || 0);
    current.ws2 += (item.ws2 || 0);
    current.ws3 += (item.ws3 || 0);
    current.ws4 += (item.ws4 || 0);
    current.ws5 += (item.ws5 || 0);
    // Level Ghost
    current.ws6 += (item.ws6 || 0);
    current.ws7 += (item.ws7 || 0);
    current.ws8 += (item.ws8 || 0);
    current.ws9 += (item.ws9 || 0);
    current.ws10 += (item.ws10 || 0);

    // Admit
    current.wa1 += (item.wa1 || 0); current.wa11 += (item.wa11 || 0);
    current.wa2 += (item.wa2 || 0); current.wa22 += (item.wa22 || 0);

    // D/C
    current.wdc1 += (item.wdc1 || 0); current.wdc11 += (item.wdc11 || 0);
    current.wdc2 += (item.wdc2 || 0); current.wdc22 += (item.wdc22 || 0);
    current.wdc3 += (item.wdc3 || 0); current.wdc33 += (item.wdc33 || 0);
    current.wdc4 += (item.wdc4 || 0); current.wdc44 += (item.wdc44 || 0);
    current.wdc5 += (item.wdc5 || 0); current.wdc55 += (item.wdc55 || 0);
    current.wdc6 += (item.wdc6 || 0); current.wdc66 += (item.wdc66 || 0);
    current.wdc7 += (item.wdc7 || 0); current.wdc77 += (item.wdc77 || 0);

    // Staff
    current.wn1 += (item.wn1 || 0);
    current.wrn1 += (item.wrn1 || 0);
    current.wrn2 += (item.wrn2 || 0);
    current.wpn1 += (item.wpn1 || 0);
    current.wpn2 += (item.wpn2 || 0);
    current.wna1 += (item.wna1 || 0);
    current.wna2 += (item.wna2 || 0);
  });
  
  return Object.values(grouped).sort((a, b) => {
    // ✅ Sort แบบ local date
    const dateA = new Date(a.wdates);
    const dateB = new Date(b.wdates);
    
    const yearA = dateA.getFullYear();
    const yearB = dateB.getFullYear();
    if (yearA !== yearB) return yearA - yearB;
    
    const monthA = dateA.getMonth();
    const monthB = dateB.getMonth();
    if (monthA !== monthB) return monthA - monthB;
    
    const dayA = dateA.getDate();
    const dayB = dateB.getDate();
    if (dayA !== dayB) return dayA - dayB;
    
    return a.catid - b.catid;
  });
};
  const getRowSpanForDate = (data: GroupedWorkAdd[], currentIndex: number) => {
    const currentDate = new Date(data[currentIndex].wdates).toDateString();
    let count = 1;
    for (let i = currentIndex + 1; i < data.length; i++) {
      if (new Date(data[i].wdates).toDateString() === currentDate) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const isFirstRowOfDate = (data: GroupedWorkAdd[], currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentDate = new Date(data[currentIndex].wdates).toDateString();
    const prevDate = new Date(data[currentIndex - 1].wdates).toDateString();
    return currentDate !== prevDate;
  };

  // ✅ Logic คำนวณผลรวม
  const calculateTotalMain = (data: WorkAdd) => (data.ws1||0)+(data.ws2||0)+(data.ws3||0)+(data.ws4||0)+(data.ws5||0);
  const calculateTotalGhost = (data: WorkAdd) => (data.ws6||0)+(data.ws7||0)+(data.ws8||0)+(data.ws9||0)+(data.ws10||0);

  // ✅ ฟังก์ชันสั่งพิมพ์
  const handlePrint = () => {
    if (!userInfo || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือก เดือน และ ปี ให้ครบถ้วนก่อนพิมพ์");
      return;
    }
    const url = `/report/print?wardid=${userInfo.wardid}&month=${selectedMonth}&year=${selectedYear}`;
    window.open(url, '_blank');
  };

  // ✅ ฟังก์ชัน Export Excel
  const handleExportExcel = async () => {
    if (!userInfo || !selectedMonth || !selectedYear || workAdds.length === 0) {
      alert("กรุณาเลือก เดือน และ ปี และมีข้อมูลก่อน Export");
      return;
    }

    const ExcelJS = (await import('exceljs')).default;
    const grouped = groupAndSortData(workAdds);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงาน');
    
    // Row 1: Title
    worksheet.mergeCells('A1:X1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `สรุปยอดภาระงานหอผู้ป่วย [ ${getDisplayWardName()} ] ประจำเดือน ${displayInfo.m} พ.ศ. ${displayInfo.y}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;
    
    worksheet.addRow([]);
    
    // Rows 3-5: Headers
    worksheet.addRow([
      'วันที่', 'เวร', 
      'ระดับความรุนแรงผู้ป่วย', '', '', '', '', 
      'รวม', 
      'Admit', '', 
      'D/C', '', '', '', '', '', '', 
      'อัตรากำลังพล', '', '', '', '', '', ''
    ]);
    
    worksheet.addRow([
      '', '', 
      'ระดับ1', 'ระดับ2', 'ระดับ3', 'ระดับ4', 'ระดับ5', 
      '', 
      'รับใหม่', 'รับย้าย', 
      'ย้ายไป', '', 'จำหน่าย', 'Refer', 'ไม่สมัครใจรักษา', 'หนี', 'เสียชีวิต',
      'Head ward', 'RN', '', 'PN', '', 'NA', ''
    ]);
    
    worksheet.addRow([
      '', '', 
      '', '', '', '', '', 
      '', 
      '', '', 
      'ward', 'ICU', '', '', '', '', '',
      '', 'ปกติ', 'เสริม', 'ปกติ', 'เสริม', 'ปกติ', 'เสริม'
    ]);
    
    // Merges
    const merges = [
        'A3:A5', 'B3:B5', 'C3:G3', 'H3:H5', 'I3:J3', 'K3:Q3', 'R3:X3',
        'C4:C5', 'D4:D5', 'E4:E5', 'F4:F5', 'G4:G5', 'I4:I5', 'J4:J5',
        'K4:L4', 'M4:M5', 'N4:N5', 'O4:O5', 'P4:P5', 'Q4:Q5', 'R4:R5',
        'S4:T4', 'U4:V4', 'W4:X4'
    ];
    merges.forEach(range => worksheet.mergeCells(range));
    
    // Header Style
    const headerFill: FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    const headerFont = { bold: true, size: 11 };
    const headerAlign: Partial<Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const headerBorder: Partial<Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    
    [3, 4, 5].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = headerAlign;
        cell.border = headerBorder;
      });
    });
    
    // Data Rows
    let currentRowNum = 6;
    grouped.forEach((item, index) => {
      const isFirstRow = isFirstRowOfDate(grouped, index);
      const dateValue = isFirstRow ? new Date(item.wdates).getDate() : '';
      
      const dataRow = worksheet.addRow([
        dateValue,
        categories.find(c => c.catid === item.catid)?.catname || '-',
        // Levels with Ghost
        `${item.ws1 || 0}(${item.ws6 || 0})`,
        `${item.ws2 || 0}(${item.ws7 || 0})`,
        `${item.ws3 || 0}(${item.ws8 || 0})`,
        `${item.ws4 || 0}(${item.ws9 || 0})`,
        `${item.ws5 || 0}(${item.ws10 || 0})`,
        // Total
        `${calculateTotalMain(item)}(${calculateTotalGhost(item)})`,
        // Admit
        `${item.wa1 || 0}(${item.wa11 || 0})`,
        `${item.wa2 || 0}(${item.wa22 || 0})`,
        // ✅ D/C Correct Order (Ward -> ICU -> Home -> Refer...)
        `${item.wdc1 || 0}(${item.wdc11 || 0})`, // Ward
        `${item.wdc4 || 0}(${item.wdc44 || 0})`, // ICU (Moved here)
        `${item.wdc2 || 0}(${item.wdc22 || 0})`, // Home (จำหน่าย)
        `${item.wdc3 || 0}(${item.wdc33 || 0})`, // Refer
        `${item.wdc5 || 0}(${item.wdc55 || 0})`, // Against
        `${item.wdc6 || 0}(${item.wdc66 || 0})`, // Escape
        `${item.wdc7 || 0}(${item.wdc77 || 0})`, // Death
        
        item.wn1 || 0,
        item.wrn1 || 0, item.wrn2 || 0,
        item.wpn1 || 0, item.wpn2 || 0,
        item.wna1 || 0, item.wna2 || 0
      ]);
      
      const fillColor = index % 2 === 0 ? 'FFEBF1DE' : 'FFFFFFCC';
      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      });
      currentRowNum++;
    });
    
    currentRowNum = 6;
    grouped.forEach((item, index) => {
      if (isFirstRowOfDate(grouped, index)) {
        const rowSpan = getRowSpanForDate(grouped, index);
        if (rowSpan > 1) {
          worksheet.mergeCells(`A${currentRowNum}:A${currentRowNum + rowSpan - 1}`);
        }
      }
      currentRowNum++;
    });
    
    worksheet.columns = [
      { width: 10 }, { width: 8 }, 
      { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, 
      { width: 10 }, 
      { width: 10 }, { width: 10 }, 
      { width: 11 }, { width: 11 }, { width: 10 }, { width: 8 }, { width: 14 }, { width: 8 }, { width: 11 }, 
      { width: 11 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }
    ];
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานภาระงาน_${displayInfo.m}_${displayInfo.y}.xlsx`;
    link.click();
  };

  const RenderDouble = ({ main, ghost, colorClass ,colorClasss}: { main?: number, ghost?: number, colorClass?: string, colorClasss?: string }) => {
    const m = main || 0;
    const g = ghost || 0;
    const defaultColor = m > 0 ? "text-blue-900 font-bold" : "text-black";
    const defaultColors = g > 0 ? "text-blue-900 font-bold" : "text-black";
    const finalColor = colorClass || defaultColor;
    const finalColos = colorClasss || defaultColors;
    
    return (
      <div className="flex items-center justify-center whitespace-nowrap">
        <span className={finalColor}>  {/* ← ใช้ finalColor แทน */}
          {m}
        </span>
        <span className={finalColos}>({g})</span>  
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;

  const groupedData = groupAndSortData(workAdds);

  return (
    <div className="min-h-screen bg-gradient-page p-4 font-sans text-primary opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- Header Control Responsive --- */}
        <div className="text-center mb-6 px-4 md:px-0">
          
          {/* Title: ปรับขนาดตัวอักษรให้ใหญ่ขึ้นเล็กน้อยบนจอใหญ่ */}
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-primary">
            สรุปยอดภาระงานหอผู้ป่วย [ {getDisplayWardName()} ]
          </h1>

          <div className="flex justify-center">
            {/* Filter Container: Mobile=Vertical, Desktop=Horizontal */}
            <div className="bg-filter-section flex flex-col md:flex-row items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 rounded-xl border border-blue-200 shadow-sm w-full md:w-auto max-w-3xl">
              
              {/* 1. Label Section */}
              <div className="flex items-center gap-2 self-start md:self-center mb-2 md:mb-0">
                <div className="p-1  rounded-full shadow-sm">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-primary whitespace-nowrap">วันที่บันทึก</span>
              </div>

              {/* 2. Inputs Section: Grid on Mobile / Flex on Desktop */}
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
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

                {/* Year Select */}
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full md:w-auto bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">ปี พ.ศ. [ค.ศ.]</option>
                  {Array.from({ length: 15 }, (_, i) => {
                    const thYear = 2569 - i;
                    const enYear = thYear - 543;
                    return <option key={thYear} value={thYear}>{thYear}-[{enYear}]</option>;
                  })}
                </select>
              </div>

              {/* 3. Action Buttons Section */}
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={handleSearch} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg flex-1 md:flex-none justify-center bg-white text-gray-800 border-2 border-red-400 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all cursor-pointer shadow-sm hover:bg-red-100 hover:text-black whitespace-nowrap"
                >
                  ตกลง
                </button>
                
                <button 
                  onClick={handleExportExcel} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg flex-none bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition shadow-md flex items-center justify-center"
                  title="Export Excel"
                > 
                  <img src="/EXCEL.png" alt="excel" className='w-6 h-6 object-contain' /> 
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- Title & Excel --- */}
        <div className="flex items-center justify-center gap-4 relative mb-4">
            <h2 className="text-xl font-bold">
                สรุปยอดภาระงานหอผู้ป่วย [ {getDisplayWardName()} ] ประจำเดือน {displayInfo.m} พ.ศ. {displayInfo.y}
            </h2>
            
        </div>

        {/* --- Table --- */}
        <div className="overflow-x-auto border-t-2 border-black">
          <table className="w-full text-xs text-black border-collapse border border-black">
             <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
                <tr>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">วันที่</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[70px] bg-gradient-to-br from-slate-600 to-slate-700">เวร</th>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                  <th rowSpan={3} className="bg-gradient-row5 border-2 border-indigo-400/50 px-2 py-3 min-w-[50px] bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">รวม</th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                  <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
                  <th colSpan={7} className="bg-gradient-row4 bg-gradient-to-r from-amber-600 to-red-500 border-2 border-amber-400/50 px-2 py-3 shadow-lg">อัตรากำลังผล</th>
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
              {groupedData.length === 0 ? (
                <tr><td colSpan={27} className="border border-black px-4 py-8 text-center text-gray-500 bg-white">ไม่พบข้อมูล</td></tr>
              ) : (
                groupedData.map((item, index) => {
                  const isFirstRow = isFirstRowOfDate(groupedData, index);
                  const rowSpan = isFirstRow ? getRowSpanForDate(groupedData, index) : 0;
                  
                  return (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-[#F8F8FF]' : 'bg-[#F0FFFF]'} hover:bg-yellow-100 transition-colors`}>
                      
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="border border-black px-1 py-1 text-center text-xs font-bold whitespace-nowrap">
                          วันที่ {new Date(item.wdates).getDate()}
                        </td>
                      )}
                      
                      <td className="border border-black px-3 py-3 text-center font-bold">
                        {categories.find(c => c.catid === item.catid)?.catname || '-'}
                      </td>

                      {/* Levels */}
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.ws1} ghost={item.ws6} colorClass={item.ws1 >= 0 ? "text-ws1 font-bold" : "text-black font-bold"} colorClasss={item.ws6 >= 0 ? "text-ws6 font-bold" : "text-black font-bold"} /></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.ws2} ghost={item.ws7} colorClass={item.ws2 >= 0 ? "text-ws2 font-bold" : "text-black font-bold"} colorClasss={item.ws7 >= 0 ? "text-ws7 font-bold" : "text-black font-bold"} /></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.ws3} ghost={item.ws8} colorClass={item.ws3 >= 0 ? "text-ws3 font-bold" : "text-black font-bold"} colorClasss={item.ws8 >= 0 ? "text-ws8 font-bold" : "text-black font-bold"} /></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.ws4} ghost={item.ws9} colorClass={item.ws4 >= 0 ? "text-ws4 font-bold" : "text-black font-bold"} colorClasss={item.ws9 >= 0 ? "text-ws9 font-bold" : "text-black font-bold"} /></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.ws5} ghost={item.ws10} colorClass={item.ws5 >= 0 ? "text-ws5 font-bold" : "text-black font-bold"} colorClasss={item.ws10 >= 0 ? "text-ws10 font-bold" : "text-black font-bold"} /></td>
                      
                      {/* Total */}
                      <td className="border border-black px-1 py-1 text-center font-bold  bg-blue-100">
                         <RenderDouble main={calculateTotalMain(item)} ghost={calculateTotalGhost(item)} />
                      </td>

                      {/* Admit */}
                      <td className="border border-black px-1 py-1 text-cente"><RenderDouble main={item.wa1} ghost={item.wa11} colorClass={item.wa1 >= 0 ? "text-wa1 font-bold" : "text-black "} colorClasss={item.wa11 >= 0 ? "text-wa11 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wa2} ghost={item.wa22} colorClass={item.wa2 >= 0 ? "text-wa2 font-bold" : "text-black "} colorClasss={item.wa22 >= 0 ? "text-wa22 font-bold" : "text-black font-bold"}/></td>

                      {/* ✅ D/C Correct Order (Ward -> ICU -> Home -> Refer...) */}
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wdc1} ghost={item.wdc11} colorClass={item.wdc1 >= 0 ? "text-wdc1 font-bold" : "text-black "} colorClasss={item.wdc11 >= 0 ? "text-wdc11 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wdc4} ghost={item.wdc44} colorClass={item.wdc4 >= 0 ? "text-wdc4 font-bold" : "text-black "} colorClasss={item.wdc44 >= 0 ? "text-wdc44 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wdc2} ghost={item.wdc22} colorClass={item.wdc2 >= 0 ? "text-wdc2 font-bold" : "text-black "} colorClasss={item.wdc22 >= 0 ? "text-wdc22 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wdc3} ghost={item.wdc33} colorClass={item.wdc3 >= 0 ? "text-wdc3 font-bold" : "text-black "} colorClasss={item.wdc33 >= 0 ? "text-wdc33 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center"><RenderDouble main={item.wdc5} ghost={item.wdc55} colorClass={item.wdc5 >= 0 ? "text-wdc5 font-bold" : "text-black "} colorClasss={item.wdc55 >= 0 ? "text-wdc55 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center bg-red-50"><RenderDouble main={item.wdc6} ghost={item.wdc66} colorClass={item.wdc6 >= 0 ? "text-wdc6 font-bold" : "text-black "} colorClasss={item.wdc66 >= 0 ? "text-wdc66 font-bold" : "text-black font-bold"}/></td>
                      <td className="border border-black px-1 py-1 text-center bg-gray-200"><RenderDouble main={item.wdc7} ghost={item.wdc77} colorClass={item.wdc7 >= 0 ? "text-wdc7 font-bold" : "text-black "} colorClasss={item.wdc77 >= 0 ? "text-wdc77 font-bold" : "text-black font-bold"}/></td>

                      {/* Staff */}
                     <td className="border border-black px-1 py-1 text-center bg-blue-100 text-wn1 font-bold">{item.wn1 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wrn1 font-bold">{item.wrn1 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wrn2 font-bold">{item.wrn2 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wpn1 font-bold">{item.wpn1 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wpn2 font-bold">{item.wpn2 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wna1 font-bold">{item.wna1 || 0}</td>
                      <td className="border border-black px-1 py-1 text-center text-wna2 font-bold">{item.wna2 || 0}</td>
                    </tr>
                  );
                })
              )}
              <tr><td colSpan={28} className="bg-[#CCCCCC] h-8 border-t border-black"></td></tr>
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-center pb-12 gap-4">
            <button 
                onClick={handlePrint} 
                className="bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
            >
                🖨️ ตัวอย่างก่อนพิมพ์
            </button>
        </div>

      </div>
    </div>
  );
}