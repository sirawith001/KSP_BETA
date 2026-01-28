'use client';

import { FileSpreadsheet, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';

// ==================== 1. Define Interfaces ====================

interface UserInfo {
  wardid: number;
  wardname?: string;
  warduser?: string;
  [key: string]: any;
}

interface WorkAddItem {
  // Workload Levels (Adult)
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  // Workload Levels (Child)
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  // Staff
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
  [key: string]: any;
}

interface LevelData {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

interface AvgByLevelResult {
  adult: LevelData;
  child: LevelData;
}

// ==================== Main Component ====================

export default function RptProductivitySummaryPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAddItem[]>([]);
  
  const [isSearched, setIsSearched] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Display Info
  const [displayInfo, setDisplayInfo] = useState({ m: '...', y: '...' });

  // 1. Init Data
  useEffect(() => {
    const initPage = async () => {
      if (typeof window !== 'undefined') {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (!savedUserInfo) {
          window.location.href = '/login';
          return;
        }
        try {
          const user = JSON.parse(savedUserInfo);
          setUserInfo(user);
        } catch (e) {
          console.error("Error parsing user info", e);
        }
        setLoading(false);
      }
    };
    
    initPage();
  }, []);

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
        setWorkAdds(data.data);
        setDisplayInfo({
          m: getThaiMonthName(parseInt(selectedMonth)),
          y: selectedYear
        });
        setIsSearched(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  // ==================== CALCULATION FUNCTIONS ====================
  
  // Helper Function สำหรับการแสดงผล - ปัดเศษ
  const formatNumber = (value: number, decimals: number = 2): string => {
    if (!isFinite(value) || isNaN(value)) return '0.00';
    
    const multiplier = Math.pow(10, decimals);
    const rounded = Math.round(value * multiplier + Number.EPSILON) / multiplier;
    
    return rounded.toFixed(decimals);
  };
  
  // Helper สำหรับการคำนวณ - ไม่ปัดเศษ เก็บค่าทศนิยมเต็ม
  const phpRound = (value: number, decimals: number = 2): number => {
    if (!isFinite(value) || isNaN(value)) return 0;
    
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier + Number.EPSILON) / multiplier;
  };

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

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const calcByLevel = (): AvgByLevelResult => {
    const result: AvgByLevelResult = {
      adult: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
      child: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 }
    };
    
    workAdds.forEach(item => {
      result.adult.level1 += (item.ws1 || 0);
      result.adult.level2 += (item.ws2 || 0);
      result.adult.level3 += (item.ws3 || 0);
      result.adult.level4 += (item.ws4 || 0);
      result.adult.level5 += (item.ws5 || 0);
      
      result.child.level1 += (item.ws6 || 0);
      result.child.level2 += (item.ws7 || 0);
      result.child.level3 += (item.ws8 || 0);
      result.child.level4 += (item.ws9 || 0);
      result.child.level5 += (item.ws10 || 0);
    });
    
    return result;
  };

 

  const calcAvgByLevel = (): AvgByLevelResult => {
    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
    const byLevel = calcByLevel();
    
    // ⚠️ คำนวณด้วยทศนิยมเต็ม ไม่ปัดเศษ (เหมือน PHP)
    return {
      adult: {
        level1: numday > 0 ? (byLevel.adult.level1 / 3) / numday : 0,
        level2: numday > 0 ? (byLevel.adult.level2 / 3) / numday : 0,
        level3: numday > 0 ? (byLevel.adult.level3 / 3) / numday : 0,
        level4: numday > 0 ? (byLevel.adult.level4 / 3) / numday : 0,
        level5: numday > 0 ? (byLevel.adult.level5 / 3) / numday : 0
      },
      child: {
        level1: numday > 0 ? (byLevel.child.level1 / 3) / numday : 0,
        level2: numday > 0 ? (byLevel.child.level2 / 3) / numday : 0,
        level3: numday > 0 ? (byLevel.child.level3 / 3) / numday : 0,
        level4: numday > 0 ? (byLevel.child.level4 / 3) / numday : 0,
        level5: numday > 0 ? (byLevel.child.level5 / 3) / numday : 0
      }
    };
  };

  const calcAdultWorkload = () => {
    const avg = calcAvgByLevel();

    return (avg.adult.level5 * 1.5) + (avg.adult.level4 * 3.5) + (avg.adult.level3 * 5.5) + (avg.adult.level2 * 7.5) + (avg.adult.level1 * 12.5);
  };

  const calcChildWorkload = () => {
    const avg = calcAvgByLevel();
    
    return (avg.child.level5 * 1.5) + (avg.child.level4 * 3.5) + (avg.child.level3 * 5.5) + (avg.child.level2 * 7.5) + (avg.child.level1 * 12.5);
  };

  const calcFTE1 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    // ⚠️ คำนวณด้วยทศนิยมเต็ม
    return (((sumA + sumC) * 1.4 * 1.3) / 7);
  };

  const calcFTE2 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    // ⚠️ คำนวณด้วยทศนิยมเต็ม
    return (((sumA + sumC) * 1.4) / 7);
  };
  
  const calcStaffRequiredPerDay = () => {
    const fte2 = calcFTE2();
    if (fte2 === 0) return 0;
    const totalHours = fte2 * 2080;
    const daysPerYear = 365 * 7;
    // ⚠️ คำนวณด้วยทศนิยมเต็ม
    return totalHours / daysPerYear;
  };

  const calcStaffByType = () => {
    const total = calcStaffRequiredPerDay();
    return {
      rn: total * 0.65,
      pn: total * 0.25,
      na: total * 0.10
    };
  };

  const calcActualStaff = () => {
    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
    
    const totalRN = workAdds.reduce((sum, item) => sum + (item.wrn1 || 0) + (item.wrn2 || 0), 0);
    const totalPN = workAdds.reduce((sum, item) => sum + (item.wpn1 || 0) + (item.wpn2 || 0), 0);
    const totalNA = workAdds.reduce((sum, item) => sum + (item.wna1 || 0) + (item.wna2 || 0), 0);
    
    return {
      rn: totalRN / numday,
      pn: totalPN / numday,
      na: totalNA / numday,
      total: (totalRN + totalPN + totalNA) / numday
    };
  };

  const calcProductivity = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
    
    // นับเฉพาะ wrn1, wrn2, wpn1, wpn2 (ไม่รวม NA)
    const totalStaff = workAdds.reduce((sum, item) => 
      sum + (item.wrn1 || 0) + (item.wrn2 || 0) + (item.wpn1 || 0) + (item.wpn2 || 0), 0
    );
    const sumwrp = totalStaff / numday;
    const qsum = sumwrp * 7;
    
    if (qsum === 0) return 0;
    // ⚠️ คำนวณด้วยทศนิยมเต็ม
    return ((sumA + sumC) * 100) / qsum;
  };

  if (loading) {
    return <div className="p-10 text-center text-lg font-semibold">กำลังโหลด...</div>;
  }

  // --- เตรียมข้อมูลสำหรับการแสดงผล ---
  const avgByLevel = calcAvgByLevel();
  const adultWorkload = calcAdultWorkload();
  const childWorkload = calcChildWorkload();
  
  const totalAdultAvg = Object.values(avgByLevel.adult).reduce((a, b) => a + b, 0);
  const totalChildAvg = Object.values(avgByLevel.child).reduce((a, b) => a + b, 0);

  const adultNHPPD = totalAdultAvg > 0 ? adultWorkload / totalAdultAvg : 0;
  const childNHPPD = totalChildAvg > 0 ? childWorkload / totalChildAvg : 0;

  const fte1 = calcFTE1();
  const fte2 = calcFTE2();
  const partTime = fte1 - fte2;
  const staffRequired = calcStaffRequiredPerDay();
  const staffByType = calcStaffByType();
  const productivity = calcProductivity();

  // ==================== PRINT WITH HIDDEN IFRAME ====================
  const handlePrint = () => {
    if (!selectedMonth || !selectedYear) {
      alert("กรุณาเลือก เดือน และ ปี ให้ครบถ้วนก่อนพิมพ์");
      return;
    }
    
    const gregYear = parseInt(selectedYear) - 543;
    const url = `/report/rptshowmatch?month=${selectedMonth}&year=${gregYear}`;
    window.open(url, '_blank');
  };

  // ==================== EXCEL EXPORT FUNCTION ====================
  const exportToExcel = () => {
    const fileName = `Productivity_${displayInfo.m}_${displayInfo.y}.xls`;

    const styles = `
      <style>
        body { font-family: 'Sarabun', sans-serif; }
        table { border-collapse: collapse; width: 800px; table-layout: fixed; }
        th, td { border: 1px solid #000000; padding: 8px; vertical-align: middle; font-size: 14px; }
        .bg-blue { background-color: #4472C4; color: white; font-weight: bold; text-align: center; }
        .bg-light { background-color: #D9E1F2; color: black; font-weight: bold; text-align: left; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .title { font-size: 20px; font-weight: bold; text-align: center; border: none; height: 40px; }
        .bold { font-weight: bold; }
        .highlight-result { font-size: 16px; font-weight: bold; color: #000; background-color: #FFFF00; text-align: center; }
        .num { mso-number-format:"\#\,\#\#0\.00"; text-align: center; }
      </style>
    `;

    const levelRows = [
        { name: 'ประเภท 5 (x1.5)', adultKey: 'level5' as keyof LevelData, childKey: 'level5' as keyof LevelData, w: 1.5 },
        { name: 'ประเภท 4 (x3.5)', adultKey: 'level4' as keyof LevelData, childKey: 'level4' as keyof LevelData, w: 3.5 },
        { name: 'ประเภท 3 (x5.5)', adultKey: 'level3' as keyof LevelData, childKey: 'level3' as keyof LevelData, w: 5.5 },
        { name: 'ประเภท 2 (x7.5)', adultKey: 'level2' as keyof LevelData, childKey: 'level2' as keyof LevelData, w: 7.5 },
        { name: 'ประเภท 1 (x12.5)', adultKey: 'level1' as keyof LevelData, childKey: 'level1' as keyof LevelData, w: 12.5 },
    ];

    const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        ${styles}
      </head>
      <body>
        <table>
          <colgroup> <col style="width: 250px"> <col style="width: 110px"> <col style="width: 110px"> <col style="width: 165px"> <col style="width: 165px"> </colgroup>

          <tr><td colspan="5" class="title">ตารางสรุปภาระงานรายเดือน ${displayInfo.m} พ.ศ. ${displayInfo.y}</td></tr>
          <tr><td colspan="5" class="title">${getDisplayWardName()}</td></tr>
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>

          <tr><th colspan="5" class="bg-light" style="text-align:left;">1. ข้อมูลทั่วไป</th></tr>
          <tr>
            <td class="text-left">ผู้ป่วยเสียชีวิต (ผู้ใหญ่)</td><td class="num">0.00</td>
            <td class="text-left">ผู้ป่วยเสียชีวิต (เด็ก)</td><td class="num" colspan="2">0.00</td>
          </tr>
          <tr>
            <td class="text-left">ผู้ป่วยเฉลี่ย/วัน (ผู้ใหญ่)</td><td class="num">${formatNumber(totalAdultAvg)}</td>
            <td class="text-left">ผู้ป่วยเฉลี่ย/วัน (เด็ก)</td><td class="num" colspan="2">${formatNumber(totalChildAvg)}</td>
          </tr>
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>

          <tr><th colspan="5" class="bg-light">2. แยกความประเมินและภาระงาน</th></tr>
          <tr>
            <th rowspan="2" class="bg-blue">ประเภท</th><th colspan="2" class="bg-blue">แยกตามประเภท (ราย/วัน)</th><th colspan="2" class="bg-blue">ชม.ความต้องการพยาบาล</th>
          </tr>
          <tr>
            <th class="bg-blue">ผู้ใหญ่</th><th class="bg-blue">เด็ก</th><th class="bg-blue">ผู้ใหญ่</th><th class="bg-blue">เด็ก</th>
          </tr>
          
          ${levelRows.map(row => `
            <tr>
              <td class="text-left">${row.name}</td>
              <td class="num">${formatNumber(avgByLevel.adult[row.adultKey])}</td>
              <td class="num">${formatNumber(avgByLevel.child[row.childKey])}</td>
              <td class="num">${formatNumber(avgByLevel.adult[row.adultKey] * row.w)}</td>
              <td class="num">${formatNumber(avgByLevel.child[row.childKey] * row.w)}</td>
            </tr>
          `).join('')}
          
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>
          <tr><th colspan="5" class="bg-light">3. รวมจำนวนการพยาบาลเฉลี่ย / ราย / วัน</th></tr>
          <tr>
            <td colspan="2" class="text-center">ผู้ใหญ่ = <b>${formatNumber(adultNHPPD)}</b> ชม./ราย/วัน</td>
            <td colspan="3" class="text-center">เด็ก = <b>${formatNumber(childNHPPD)}</b> ชม./ราย/วัน</td>
          </tr>
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>

          <tr><th colspan="5" class="bg-light">4. อัตรากำลัง</th></tr>
          <tr>
            <td class="text-left">FTE 1</td><td class="num">${formatNumber(fte1)}</td>
            <td class="text-left">FTE 2</td><td class="num">${formatNumber(fte2)}</td>
            <td class="text-left">Part Time: ${formatNumber(partTime)}</td>
          </tr>
          <tr>
            <td colspan="2" class="text-right bold">อัตรากำลังที่ต้องการ/วัน :</td>
            <td colspan="3" class="text-left bold" style="color:red;">${formatNumber(staffRequired)} คน</td>
          </tr>
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>

          <tr><th colspan="5" class="bg-light">5. การกระจายอัตรากำลัง</th></tr>
          <tr>
            <th class="bg-blue">ประเภท</th><th class="bg-blue">สัดส่วน</th><th class="bg-blue">เช้า</th><th class="bg-blue">บ่าย</th><th class="bg-blue">ดึก</th>
          </tr>
           ${[
             { name: 'RN (65%)', val: staffByType.rn },
             { name: 'PN (25%)', val: staffByType.pn },
             { name: 'NA (10%)', val: staffByType.na },
           ].map(r => `
            <tr>
              <td class="text-left">${r.name}</td>
              <td class="num">${formatNumber(r.val)}</td>
              <td class="num">${formatNumber(r.val * 0.4)}</td>
              <td class="num">${formatNumber(r.val * 0.35)}</td>
              <td class="num">${formatNumber(r.val * 0.25)}</td>
            </tr>
            `).join('')}
            <tr>
              <td class="bg-light text-right">Productivity</td>
              <td colspan="4" class="highlight-result">${formatNumber(productivity)}%</td>
            </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-page text-white bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 font-sans opacity-0 animate-fadeIn">
      <div id="printable-content" className="max-w-6xl mx-auto">
        
        {/* Header Control */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 no-print bg-filter-section text-primary">
          <h1 className="text-2xl font-bold text-primary mb-4">📊 ตารางสรุปภาระงานรายเดือน</h1>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-primary mb-2">เลือกเดือน</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
              >
                <option value="">-- เลือกเดือน --</option>
                {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                  <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')} - {m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-primary mb-2">เลือกปี พ.ศ.</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
              >
                <option value="">-- เลือกปี --</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const thYear = 2572 - i;
                  const enYear = thYear - 543;
                  return <option key={thYear} value={thYear}>{thYear}-[{enYear}]</option>;
                })}
              </select>
            </div>
            <button 
              onClick={handleSearch} 
              className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-gradient-header text-white bg-gradient-to-r from-green-500 to-green-600  px-8 py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold shadow-md transition transform hover:scale-105"
            >
              🔍 ค้นหา
            </button>
            
            {isSearched && (
              <>
                <button 
                  onClick={exportToExcel}
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-green-600 text-white px-3 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  <img src="/EXCEL.png" alt="excel" className='w-7 h-7' />
                </button>
                <button 
                  onClick={handlePrint}
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-gray-600 text-white px-3 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  <img src="/PRINTER.png" alt="printer" className='w-7 h-7' />
                </button>
              </>
            )}
          </div>
        </div>
        
        {isSearched && (
          <>
            {/* Title Section */}
            <div className="bg-gradient-header-a text-primary border-blue-200 border-2 rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h2 className="text-xl font-bold  text-center mb-2">
                ตารางสรุปประมาณรายเดือน
              </h2>
              <p className="text-center ">
                <span className="font-semibold">{displayInfo.m}</span> พ.ศ. <span className="font-semibold">{displayInfo.y}</span> | 
                <span className="font-semibold ml-2">{getDisplayWardName()}</span>
              </p>
            </div>

            {/* Section 1 */}
            <div className="flex justify-center mb-6 break-inside-avoid ">
              <div className=" rounded-xl shadow-md p-6 w-full max-w-md bg-gradient-header-a ">
                <h3 className="text-lg font-bold text-primary mb-4">1. ผู้ป่วยเฉลี่ย (ราย/วัน)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg bg-gradient-header-a">
                    <span className="font-semibold text-primary">ผู้ใหญ่</span>
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-lg font-bold bg-gradient-header-row">
                      {formatNumber(totalAdultAvg)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg bg-gradient-header-a">
                    <span className="font-semibold text-primary">เด็ก</span>
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-lg font-bold bg-gradient-header-row">
                      {formatNumber(totalChildAvg)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Severity Level Table */}
            <div className="bg-filter-section text-primary rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold mb-4 text-primary">แยกความประเมินและภาระงาน</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-header-row bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                      <th rowSpan={2} className="px-4 py-3 border border-military-400 font-semibold align-middle">
                        ประเภท
                      </th>
                      <th colSpan={2} className="px-4 py-2 border border-military-400 font-semibold">
                        แยกตามประเภท
                      </th>
                      <th colSpan={2} className="px-4 py-2 border border-military-400 font-semibold">
                        ชม.ความต้องการพยาบาล
                      </th>
                    </tr>
                    <tr className="bg-gradient-header-row bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                      <th className="px-2 py-2 border border-military-400 font-medium">ผู้ใหญ่ (ราย/วัน)</th>
                      <th className="px-2 py-2 border border-military-400 font-medium">เด็ก (ราย/วัน)</th>
                      <th className="px-2 py-2 border border-military-400 font-medium">ผู้ใหญ่ (ชม./วัน)</th>
                      <th className="px-2 py-2 border border-military-400 font-medium">เด็ก (ชม./วัน)</th>
                    </tr>
                  </thead>
                  <tbody className='bg-gradient-row text-primary'>
                    {[
                      { name: 'ประเภท 5', adultKey: 'level5' as keyof LevelData, childKey: 'level5' as keyof LevelData, weight: 1.5 },
                      { name: 'ประเภท 4', adultKey: 'level4' as keyof LevelData, childKey: 'level4' as keyof LevelData, weight: 3.5 },
                      { name: 'ประเภท 3', adultKey: 'level3' as keyof LevelData, childKey: 'level3' as keyof LevelData, weight: 5.5 },
                      { name: 'ประเภท 2', adultKey: 'level2' as keyof LevelData, childKey: 'level2' as keyof LevelData, weight: 7.5 },
                      { name: 'ประเภท 1', adultKey: 'level1' as keyof LevelData, childKey: 'level1' as keyof LevelData, weight: 12.5 }
                    ].map((item) => (
                      <tr key={item.adultKey} className=" text-gray-800">
                        <td className="px-4 py-3 border border-gray-300 font-semibold   text-primary">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {formatNumber(avgByLevel.adult[item.adultKey])}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {formatNumber(avgByLevel.child[item.childKey])}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center font-bold text-primary">
                          {formatNumber(avgByLevel.adult[item.adultKey] * item.weight)}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {formatNumber(avgByLevel.child[item.childKey] * item.weight)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: NHPPD Calculation */}
            <div className=" rounded-xl shadow-md p-6 mb-6 break-inside-avoid bg-filter-section text-primary">
              <h3 className="text-lg font-bold mb-6 text-primary">
                2. รวมจำนวนการพยาบาลเฉลี่ย / ราย / วัน
              </h3>
              
              <div className="flex flex-col gap-6 px-4 md:px-10 bg-filter-section border rounded-xl p-4">
                {/* ผู้ใหญ่ */}
                <div className="space-y-2">
                  <div className="flex items-center flex-wrap gap-2 text-sm ">
                    <span className="font-semibold min-w-[60px] text-primary">ผู้ใหญ่</span>
                    <span className="font-semibold mx-2">=</span>
                    <span className="text-xs text-primary">
                      [{formatNumber(avgByLevel.adult.level5)}×1.5]+[{formatNumber(avgByLevel.adult.level4)}×3.5]+
                      [{formatNumber(avgByLevel.adult.level3)}×5.5]+[{formatNumber(avgByLevel.adult.level2)}×7.5]+
                      [{formatNumber(avgByLevel.adult.level1)}×12.5]
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-sm text-primary pl-20">
                    <span>÷ {formatNumber(totalAdultAvg)}</span>
                    <span className="font-bold mx-2 text-primary">=</span>
                    <span className="font-bold text-2xl ">
                      {formatNumber(adultNHPPD)}
                    </span>
                    <span className="font-bold ml-2 text-primary">ชม./ราย/วัน</span>
                  </div>
                </div>

                {/* เด็ก */}
                <div className="space-y-2">
                  <div className="flex items-center flex-wrap gap-2 text-sm ">
                    <span className="font-semibold min-w-[60px] text-primary">เด็ก</span>
                    <span className="font-semibold mx-2 text-primary">=</span>
                    <span className="text-xs text-primary">
                      [{formatNumber(avgByLevel.child.level5)}×1.5]+[{formatNumber(avgByLevel.child.level4)}×3.5]+
                      [{formatNumber(avgByLevel.child.level3)}×5.5]+[{formatNumber(avgByLevel.child.level2)}×7.5]+
                      [{formatNumber(avgByLevel.child.level1)}×12.5]
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-sm text-primary pl-20">
                    <span>÷ {formatNumber(totalChildAvg)}</span>
                    <span className="font-bold mx-2 text-primary">=</span>
                    <span className="font-bold text-2xl text-primary">
                      {formatNumber(childNHPPD)}
                    </span>
                    <span className="font-bold ml-2 text-primary">ชม./ราย/วัน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Break */}
            <div className="page-break"></div>

            {/* Section 4: FTE Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 break-inside-avoid ">
              <div className="bg-gradient-header-row bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">FTE 1</p>
                <p className="text-3xl font-bold">{formatNumber(fte1)}</p>
                <p className="text-xs mt-2 opacity-90">(× 1.4 × 1.3) / 7</p>
              </div>

              <div className="bg-gradient-header-row bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">FTE 2</p>
                <p className="text-3xl font-bold">{formatNumber(fte2)}</p>
                <p className="text-xs mt-2 opacity-90">(× 1.4) / 7</p>
              </div>

              <div className="bg-gradient-header-row bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">Part Time</p>
                <p className="text-3xl font-bold">{formatNumber(partTime)}</p>
                <p className="text-xs mt-2 opacity-90">FTE1 - FTE2</p>
              </div>
            </div>

            {/* Section 4.5: Staff Required */}
            <div className=" rounded-xl shadow-md p-6 mb-6 break-inside-avoid bg-filter-section text-primary">
              <h3 className="text-lg font-bold text-primary mb-4">3. อัตรากำลังที่ต้องการ / วัน</h3>
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg bg-filter-section">
                <p className="text-center font-semibold text-primary mb-2">
                  ({formatNumber(adultWorkload)} + {formatNumber(childWorkload)}) × 2,080 ชม./ปี ÷ (365 วัน × 7 เวร)
                </p>
                <p className="text-center text-3xl font-bold text-primary">
                  {formatNumber(staffRequired)} คน/วัน
                </p>
              </div>
            </div>

            {/* Section 5: Staff Distribution Table */}
            <div className=" rounded-xl shadow-md p-6 mb-6 break-inside-avoid bg-filter-section">
              <h3 className="text-lg font-bold text-primary mb-4">4. การกระจายอัตรากำลังต่อวันต่อเวร</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-header-row border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                      <th className="px-4 py-3 text-center font-semibold">สัดส่วน</th>
                      <th className="px-4 py-3 text-center font-semibold">เช้า (40%)</th>
                      <th className="px-4 py-3 text-center font-semibold">บ่าย (35%)</th>
                      <th className="px-4 py-3 text-center font-semibold">คืน (25%)</th>
                      <th className="px-4 py-3 text-center font-semibold text-lg">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'RN', key: 'rn', color: 'bg-blue-50' },
                      { name: 'PN', key: 'pn', color: 'bg-green-50' },
                      { name: 'NA', key: 'na', color: 'bg-orange-50' }
                    ].map((item) => {
                      const key = item.key as keyof typeof staffByType;
                      const val = staffByType[key];

                      return (
                        <tr key={item.key} className={`${item.color} border-b border-gray-200 bg-gradient-row text-primary`}>
                          <td className="px-4 py-3 font-semibold ">{item.name}</td>
                          <td className="px-4 py-3 text-center ">
                            {item.key === 'rn' ? '65%' : item.key === 'pn' ? '25%' : '10%'}
                          </td>
                          <td className="px-4 py-3 text-center ">{formatNumber(val * 0.4)}</td>
                          <td className="px-4 py-3 text-center">{formatNumber(val * 0.35)}</td>
                          <td className="px-4 py-3 text-center">{formatNumber(val * 0.25)}</td>
                          <td className="px-4 py-3 text-center font-bold text-lg">{formatNumber(val)}</td>
                          
                        </tr>
                      );
                    })}
                    <tr className="bg-gradient-header-row text-white font-bold border-t-2 border-gray-300">
                      <td className="px-4 py-3">รวม</td>
                      <td className="px-4 py-3 text-center ">100%</td>
                      <td className="px-4 py-3 text-center">40%</td>
                      <td className="px-4 py-3 text-center">35%</td>
                      <td className="px-4 py-3 text-center">25%</td>
                      <td className="px-4 py-3 text-center text-lg">{formatNumber(staffByType.rn + staffByType.pn + staffByType.na)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Productivity Result */}
            <div className="bg-filter-section  bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg p-8 mb-6 text-white break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-primary">5. ผลผลิต</h3>
              <div className=" p-6 rounded-lg backdrop-blur-sm bg-filter-section text-primary ">
                <p className="text-center mb-2 font-semibold text-sm text-primary">
                  ({formatNumber(adultWorkload)} + {formatNumber(childWorkload)}) × 100 ÷ 
                  ({(() => {
                    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
                    const actualStaffRN_PN = workAdds.reduce((sum, item) => 
                      sum + (item.wrn1 || 0) + (item.wrn2 || 0) + (item.wpn1 || 0) + (item.wpn2 || 0), 0
                    );
                    return formatNumber(actualStaffRN_PN / numday);
                  })()} × 7) =
                </p>

                <p className="text-center text-5xl font-bold text-primary">
                  {formatNumber(productivity)}%
                </p>

                <p className="text-center mt-4 text-sm  text-primary">
                  {productivity < 80 ? '⚠️ ต่ำ - ทรัพยากรเกิน' : '✅ ปกติ/สูง'}
                </p>
              </div>
            </div>

            {/* Print & Download Buttons */}
            <div className="flex justify-center gap-4 no-print pb-10">
              <button 
                onClick={handlePrint}
                className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-5 rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <img src="/PRINTER.png" alt="printer" className='h-15 w-15' />
              </button>
              
              <button 
                onClick={exportToExcel}
                className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-5 rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <img src="/EXCEL.png" alt="excel" className='h-15 w-15' />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}