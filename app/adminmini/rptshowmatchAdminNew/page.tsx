'use client';

import { useState, useEffect } from 'react';

// ==================== 1. Define Interfaces (เพิ่มส่วนนี้เพื่อแก้ Type Error) ====================

interface Ward {
  wardid: number;
  wardname: string;
  warduser: string;
}

interface UserInfo {
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
  [key: string]: any; // อนุญาตให้มี key อื่นๆ ได้
}

// Interface สำหรับโครงสร้างข้อมูลการคำนวณ Level
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
  // แก้ไข useState ให้ระบุ Type
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAddItem[]>([]); // แก้ never[]
  const [wards, setWards] = useState<Ward[]>([]); // แก้ never[]
  
  const [isSearched, setIsSearched] = useState(false);
  
  // Filters
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [displayInfo, setDisplayInfo] = useState({ m: '...', y: '...', ward: '...' });

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
          
          // ดึงรายชื่อ Ward ทั้งหมด
          fetchWards();
        } catch (e) {
          console.error("Error parsing user info", e);
        }
        setLoading(false);
      }
    };
    
    initPage();
  }, []);

  // 2. ดึงรายชื่อ Ward
  const fetchWards = async () => {
    try {
      const response = await fetch('/api/wards');
      const data = await response.json();
      
      if (data.success) {
        setWards(data.data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  // 3. Search Function
  const handleSearch = async () => {
    if (!selectedWard || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือก หอผู้ป่วย, เดือน และ ปี ให้ครบถ้วน");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      
      const params = new URLSearchParams({
        wardid: selectedWard,
        month: selectedMonth,
        year: gregYear.toString(),
      });
      
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkAdds(data.data);
        
        // หา wardname จาก wards list
        const selectedWardData = wards.find(w => w.wardid === parseInt(selectedWard));
        
        setDisplayInfo({
          m: getThaiMonthName(parseInt(selectedMonth)),
          y: selectedYear,
          ward: selectedWardData?.wardname || selectedWardData?.warduser || '-'
        });
        setIsSearched(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  // ==================== CALCULATION FUNCTIONS ====================

  // ระบุ Type ให้ parameter
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

  // ระบุ Type ให้ parameter
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const calcByLevel = (): AvgByLevelResult => {
    const result: AvgByLevelResult = {
      adult: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
      child: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 }
    };
    
    workAdds.forEach(item => {
      // Adult (ws1-ws5)
      result.adult.level1 += Number(item.ws1 || 0); // หนักสุด (Type 1)
      result.adult.level2 += Number(item.ws2 || 0);
      result.adult.level3 += Number(item.ws3 || 0);
      result.adult.level4 += Number(item.ws4 || 0);
      result.adult.level5 += Number(item.ws5 || 0); // เบาสุด (Type 5)
      
      // Child (ws6-ws10)
      result.child.level1 += Number(item.ws6 || 0);  // หนักสุด (Type 1)
      result.child.level2 += Number(item.ws7 || 0);
      result.child.level3 += Number(item.ws8 || 0);
      result.child.level4 += Number(item.ws9 || 0);
      result.child.level5 += Number(item.ws10 || 0); // เบาสุด (Type 5)
    });
    
    return result;
  };

  const calcAvgByLevel = (): AvgByLevelResult => {
    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
    const byLevel = calcByLevel();
    
    // หาร 3 (เวร) และหาร จำนวนวัน
    return {
      adult: {
        level1: (byLevel.adult.level1 / 3) / numday || 0,
        level2: (byLevel.adult.level2 / 3) / numday || 0,
        level3: (byLevel.adult.level3 / 3) / numday || 0,
        level4: (byLevel.adult.level4 / 3) / numday || 0,
        level5: (byLevel.adult.level5 / 3) / numday || 0
      },
      child: {
        level1: (byLevel.child.level1 / 3) / numday || 0,
        level2: (byLevel.child.level2 / 3) / numday || 0,
        level3: (byLevel.child.level3 / 3) / numday || 0,
        level4: (byLevel.child.level4 / 3) / numday || 0,
        level5: (byLevel.child.level5 / 3) / numday || 0
      }
    };
  };

  const calcAdultWorkload = () => {
    const avg = calcAvgByLevel();
    // ภาระงานรวม (Total Hours)
    return (avg.adult.level5 * 1.5) + (avg.adult.level4 * 3.5) + (avg.adult.level3 * 5.5) + (avg.adult.level2 * 7.5) + (avg.adult.level1 * 12.5);
  };

  const calcChildWorkload = () => {
    const avg = calcAvgByLevel();
    
    // คำนวณตามสูตรมาตรฐานที่ถูกต้อง (ไม่เอาบั๊กของเก่า)
    const sumWorkload = (
      (avg.child.level5 * 1.5) +  // Type 5 (x1.5)
      (avg.child.level4 * 3.5) +  // Type 4 (x3.5)
      (avg.child.level3 * 5.5) +  // Type 3 (x5.5)
      (avg.child.level2 * 7.5) + 
      (avg.child.level1 * 12.5)
    );

    return sumWorkload;
  };

  const calcFTE1 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    // รวมภาระงานทั้งผู้ใหญ่และเด็ก
    return (((sumA + sumC) * 1.4 * 1.3) / 7) || 0;
  };

  const calcFTE2 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    // รวมภาระงานทั้งผู้ใหญ่และเด็ก
    return (((sumA + sumC) * 1.4) / 7) || 0;
  };

  const calcStaffRequiredPerDay = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    
    // เอาภาระงานรวม (ผู้ใหญ่ + เด็ก)
    const totalWorkload = sumA + sumC;

    return (totalWorkload * 1.14) / 7 || 0;
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

//  const calcProductivity = () => {
//     const sumA = calcAdultWorkload();
//     const sumC = calcChildWorkload();
//     const required = calcStaffRequiredPerDay(); // ใช้อัตรากำลังที่ต้องการ/วัน
//     const qsum = required * 7;
    
//     if (qsum === 0) return 0;
//     return (((sumA + sumC) * 100) / qsum) || 0;
//   };
  const calcProductivity = () => {
    const sumA = calcAdultWorkload(); // ผลรวมคะแนนผู้ใหญ่ (sumA)
    const sumC = calcChildWorkload(); // ผลรวมคะแนนเด็ก (sumB)
    const totalWorkload = sumA + sumC; // sumAllAB

    if (totalWorkload === 0) return 0;

   
    const sumDA = (totalWorkload * 1.4) / 7;

    const sumL = (sumDA * 2080) / (365 * 7);

    // 3. แปลงกลับเป็นชั่วโมงทำงาน (qsum)
    const qsum = sumL * 7;

    // 4. คำนวณ Productivity
    return (totalWorkload * 100) / qsum;
  };

  if (loading) {
    return <div className="p-10 text-center text-lg font-semibold">กำลังโหลด...</div>;
  }

  // --- เตรียมข้อมูลสำหรับการแสดงผล ---
  const avgByLevel = calcAvgByLevel();
  const adultWorkload = calcAdultWorkload();
  const childWorkload = calcChildWorkload();
  
  // คำนวณ NHPPD
  const totalAdultAvg = Object.values(avgByLevel.adult).reduce((a, b) => a + b, 0);
  const totalChildAvg = Object.values(avgByLevel.child).reduce((a, b) => a + b, 0);

  // ป้องกันการหารด้วย 0 (ถ้าไม่มีคนไข้ ให้ค่าเป็น 0)
  const adultNHPPD = totalAdultAvg > 0 ? (adultWorkload / totalAdultAvg) : 0;
  const childNHPPD = totalChildAvg > 0 ? (childWorkload / totalChildAvg) : 0;

  const fte1 = calcFTE1();
  const fte2 = calcFTE2();
  const partTime = fte1 - fte2;
  const staffRequired = calcStaffRequiredPerDay();
  const staffByType = calcStaffByType();
  // const actualStaff = calcActualStaff(); // (ถ้าต้องการใช้ uncomment)
  const actualStaff = calcActualStaff();
  const productivity = calcProductivity();

  // ==================== PRINT WITH HIDDEN IFRAME ====================
  const handlePrint = () => {
  if (!selectedWard || !selectedMonth || !selectedYear) {
    alert("กรุณาเลือก หอผู้ป่วย, เดือน และ ปี ให้ครบถ้วนก่อนพิมพ์");
    return;
  }
  
  const url = `/report/rptshowmatchAdminNew?wardid=${selectedWard}&month=${selectedMonth}&year=${selectedYear}`;
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
        .text { mso-number-format:"\@"; }
      </style>
    `;

    // ตรงส่วน map ด้านล่าง ผมแก้ array ให้เป็น type ที่ชัดเจน เพื่อแก้ error indexing
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
            <td class="text-left">ผู้ป่วยเฉลี่ย/วัน (ผู้ใหญ่)</td><td class="num">${totalAdultAvg.toFixed(2)}</td>
            <td class="text-left">ผู้ป่วยเฉลี่ย/วัน (เด็ก)</td><td class="num" colspan="2">${totalChildAvg.toFixed(2)}</td>
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
              <td class="num">${avgByLevel.adult[row.adultKey].toFixed(2)}</td>
              <td class="num">${avgByLevel.child[row.childKey].toFixed(2)}</td>
              <td class="num">${(avgByLevel.adult[row.adultKey] * row.w).toFixed(2)}</td>
              <td class="num">${(avgByLevel.child[row.childKey] * row.w).toFixed(2)}</td>
            </tr>
          `).join('')}
          
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>
          <tr><th colspan="5" class="bg-light">3. รวมจำนวนการพยาบาลเฉลี่ย / ราย / วัน</th></tr>
          <tr>
            <td colspan="2" class="text-center">ผู้ใหญ่ = <b>${adultNHPPD.toFixed(2)}</b> ชม./ราย/วัน</td>
            <td colspan="3" class="text-center">เด็ก = <b>${childNHPPD.toFixed(2)}</b> ชม./ราย/วัน</td>
          </tr>
          <tr><td colspan="5" style="border:none;">&nbsp;</td></tr>

          <tr><th colspan="5" class="bg-light">4. อัตรากำลัง</th></tr>
          <tr>
            <td class="text-left">FTE 1</td><td class="num">${fte1.toFixed(2)}</td>
            <td class="text-left">FTE 2</td><td class="num">${fte2.toFixed(2)}</td>
            <td class="text-left">Part Time: ${partTime.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" class="text-right bold">อัตรากำลังที่ต้องการ/วัน :</td>
            <td colspan="3" class="text-left bold" style="color:red;">${staffRequired.toFixed(2)} คน</td>
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
              <td class="num">${r.val.toFixed(2)}</td>
              <td class="num">${(r.val * 0.4).toFixed(2)}</td>
              <td class="num">${(r.val * 0.35).toFixed(2)}</td>
              <td class="num">${(r.val * 0.25).toFixed(2)}</td>
            </tr>
            `).join('')}
            <tr>
              <td class="bg-light text-right">Productivity</td>
              <td colspan="4" class="highlight-result">${productivity.toFixed(2)}%</td>
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
    <div className="bg-gradient-page text-primary min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 font-sans opacity-0 animate-fadeIn">
      <div id="printable-content" className="max-w-6xl mx-auto">
        
        {/* Header Control */}
        <div className="bg-filter-section rounded-xl shadow-md p-6 mb-6 no-print">
        <h1 className="text-2xl font-bold text-primary mb-4">📊 ตารางสรุปภาระงานรายเดือน</h1>
        <div className="flex flex-wrap gap-4 items-end">
            
            {/* Dropdown เลือกหอผู้ป่วย */}
            <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-primary mb-2">เลือกหอผู้ป่วย</label>
            <select 
                value={selectedWard} 
                onChange={(e) => setSelectedWard(e.target.value)} 
                className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
            >
                <option value="">-- เลือกหอผู้ป่วย --</option>
                {wards.map((ward) => (
                <option key={ward.wardid} value={ward.wardid}>
                    {ward.wardname || ward.warduser}
                </option>
                ))}
            </select>
            </div>

            {/* Dropdown เลือกเดือน */}
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

            {/* Dropdown เลือกปี */}
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

            {/* ปุ่มค้นหา */}
            <button 
            onClick={handleSearch} 
            className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-gradient-header bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold shadow-md transition transform hover:scale-105"
            >
            🔍 ค้นหา
            </button>
            
            {isSearched && (
                <>
                <button 
                    onClick={exportToExcel}
                    className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                    <img src="/EXCEL.png" alt="excel" className='w-4 h-4' />
                </button>
                <button 
                    onClick={handlePrint}
                    className="bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                    <img src="/PRINTER.png" alt="printer" className=' w-4 h-4' />

                </button>
                </>
            )}
        </div>
        </div>
        
        {isSearched && (
          <>
            {/* Title Section */}
            <div className=" rounded-xl shadow-md p-6 mb-6 break-inside-avoid bg-filter-section text-primary">
              <h2 className="text-xl font-bold text-primary text-center mb-2">
                ตารางสรุปประมาณรายเดือน
              </h2>
              <p className="text-center text-primary">
                <span className="font-semibold">{displayInfo.m}</span> พ.ศ. <span className="font-semibold">{displayInfo.y}</span> | 
                <span className="font-semibold ml-2">{getDisplayWardName()}</span>
              </p>
            </div>

            {/* Section 1 */}

            <div className="flex justify-center mb-6 break-inside-avoid ">
              <div className="bg-filter-section text-primary rounded-xl shadow-md p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-primary mb-4">1. ผู้ป่วยเฉลี่ย (ราย/วัน)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg  bg-filter-section">
                    <span className="font-semibold text-primary">ผู้ใหญ่</span>
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-lg font-bold bg-gradient-header-row">
                      
                      {(totalAdultAvg).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg  bg-filter-section">
                    <span className="font-semibold text-primary">เด็ก</span>
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-lg font-bold bg-gradient-header-row">
                      {(totalChildAvg).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Severity Level Table */}
            <div className="bg-filter-section  rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold mb-4 text-primary">แยกความประเมินและภาระงาน</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-header-row bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                      <th rowSpan={2} className="px-4 py-3 border border-blue-400 font-semibold align-middle">
                        ประเภท
                      </th>
                      <th colSpan={2} className="px-4 py-2 border border-blue-400 font-semibold">
                        แยกตามประเภท
                      </th>
                      <th colSpan={2} className="px-4 py-2 border border-blue-400 font-semibold">
                        ชม.ความต้องการพยาบาล
                      </th>
                    </tr>
                    <tr className="bg-gradient-header-row bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                      <th className="px-2 py-2 border border-blue-400 font-medium">ผู้ใหญ่ (ราย/วัน)</th>
                      <th className="px-2 py-2 border border-blue-400 font-medium">เด็ก (ราย/วัน)</th>
                      <th className="px-2 py-2 border border-blue-400 font-medium">ผู้ใหญ่ (ชม./วัน)</th>
                      <th className="px-2 py-2 border border-blue-400 font-medium">เด็ก (ชม./วัน)</th>
                    </tr>
                  </thead>
                  <tbody className='bg-gradient-row text-primary'>
                    {/* แก้ไขส่วน Loop ให้มี Type Casting */}
                    {[
                      { name: 'ประเภท 5', adultKey: 'level5' as keyof LevelData, childKey: 'level5' as keyof LevelData, weight: 1.5 },
                      { name: 'ประเภท 4', adultKey: 'level4' as keyof LevelData, childKey: 'level4' as keyof LevelData, weight: 3.5 },
                      { name: 'ประเภท 3', adultKey: 'level3' as keyof LevelData, childKey: 'level3' as keyof LevelData, weight: 5.5 },
                      { name: 'ประเภท 2', adultKey: 'level2' as keyof LevelData, childKey: 'level2' as keyof LevelData, weight: 7.5 },
                      { name: 'ประเภท 1', adultKey: 'level1' as keyof LevelData, childKey: 'level1' as keyof LevelData, weight: 12.5 }
                    ].map((item) => (
                      <tr key={item.adultKey} className=" text-gray-800">
                        <td className="px-4 py-3 border border-gray-300 font-semibold  text-primary">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {avgByLevel.adult[item.adultKey].toFixed(2)}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {avgByLevel.child[item.childKey].toFixed(2)}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center font-bold text-primary">
                          {(avgByLevel.adult[item.adultKey] * item.weight).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-center text-primary">
                          {(avgByLevel.child[item.childKey] * item.weight).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-filter-section rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold text-primary mb-6">
              2. รวมจำนวนการพยาบาลเฉลี่ย / ราย / วัน
              </h3>
              
              <div className="flex flex-col gap-6 px-4 md:px-10 bg-filter-section  border-2 rounded-2xl p-4">
                <div className="flex items-center flex-wrap gap-2 text-lg ">
                  <span className="font-bold min-w-[60px] text-primary">ผู้ใหญ่</span>
                  <span className="font-bold mx-2 text-primary">=</span>
                  <span className="font-bold text-2xl text-primary">
                     <span className="text-xs text-primary">
                    [{avgByLevel.adult.level5.toFixed(2)} × 1.5] + [{avgByLevel.adult.level4.toFixed(2)} × 3.5] + 
                    [{avgByLevel.adult.level3.toFixed(2)} × 5.5] + [{avgByLevel.adult.level2.toFixed(2)} × 7.5] + 
                    [{avgByLevel.adult.level1.toFixed(2)} × 12.5]
                  </span>
                  <span className="font-bold mx-2 text-primary">=</span>
                    {adultNHPPD.toFixed(2)}
                  </span>
                  <span className="font-bold ml-2 text-primary">ชม./ราย/วัน</span>
                </div>

                <div className="flex items-center flex-wrap gap-2 text-lg text-primary">
                  <span className="font-bold min-w-[60px] text-primary">เด็ก</span>
                  <span className="font-bold mx-2 text-primary">=</span>
                  <span className="font-bold text-2xl">
                  <span className="text-xs text-primary">
                    [{avgByLevel.child.level5.toFixed(2)} × 1.5] + [{avgByLevel.child.level4.toFixed(2)} × 3.5] +
                    [{avgByLevel.child.level3.toFixed(2)} × 5.5] + [{avgByLevel.child.level2.toFixed(2)} × 7.5] + 
                    [{avgByLevel.child.level1.toFixed(2)} × 12.5]
                  </span>
                  <span className="font-bold mx-2 text-primary">=</span>
                    {childNHPPD.toFixed(2)}
                  </span>
                  <span className="font-bold ml-2 text-primary">ชม./ราย/วัน</span>
                </div>
              </div>
            </div>

            {/* Page Break for Printing (บังคับขึ้นหน้าใหม่ - แต่ในโหมด Print แบบ Compact เราสั่ง hide ไว้แล้ว) */}
            <div className="page-break"></div>

            {/* Section 4: FTE Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 break-inside-avoid text-white">
              <div className="bg-gradient-header-row bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">FTE 1</p>
                <p className="text-3xl font-bold">{fte1.toFixed(2)}</p>
                <p className="text-xs mt-2 opacity-90">(× 1.4 × 1.3) / 7</p>
              </div>

              <div className="bg-gradient-header-row bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">FTE 2</p>
                <p className="text-3xl font-bold">{fte2.toFixed(2)}</p>
                <p className="text-xs mt-2 opacity-90">(× 1.4) / 7</p>
              </div>

              <div className="bg-gradient-header-row bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md p-6 text-white">
                <p className="text-sm font-semibold mb-2">Part Time</p>
                <p className="text-3xl font-bold">{partTime.toFixed(2)}</p>
                <p className="text-xs mt-2 opacity-90">FTE1 - FTE2</p>
              </div>
            </div>

            {/* Section 4.5: Staff Required */}
            <div className="bg-filter-section rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold text-primary mb-4">3. อัตรากำลังที่ต้องการ / วัน</h3>
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg bg-filter-section">
                <p className="text-center font-semibold text-primary mb-2">
                  ({adultWorkload.toFixed(2)} + {childWorkload.toFixed(2)}) × 2,080 ชม./ปี ÷ (365 วัน × 7 เวร)
                </p>
                <p className="text-center text-3xl font-bold text-primary">
                  {staffRequired.toFixed(2)} คน/วัน
                </p>
              </div>
            </div>

           {/* Section 5: Staff Distribution Table */}
            <div className="bg-filter-section text-primary rounded-xl shadow-md p-6 mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold text-primary mb-4">4. การกระจายอัตรากำลังต่อวันต่อเวร</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300 bg-gradient-header-row">
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
                      // ✅ แก้ไข: Cast key ให้เป็น keyof typeof staffByType
                      const key = item.key as keyof typeof staffByType;
                      const val = staffByType[key];

                      return (
                        <tr key={item.key} className={`${item.color} border-b border-gray-200 bg-gradient-row text-primary`}>
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3 text-center">
                            {item.key === 'rn' ? '65%' : item.key === 'pn' ? '25%' : '10%'}
                          </td>
                          <td className="px-4 py-3 text-center">{(val * 0.4).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{(val * 0.35).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{(val * 0.25).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center font-bold text-lg">{val.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-yellow-100 font-bold border-t-2 border-gray-300 bg-gradient-header-row text-white">
                      <td className="px-4 py-3">รวม</td>
                      <td className="px-4 py-3 text-center">100%</td>
                      <td className="px-4 py-3 text-center">40%</td>
                      <td className="px-4 py-3 text-center">35%</td>
                      <td className="px-4 py-3 text-center">25%</td>
                      <td className="px-4 py-3 text-center text-lg">{(staffByType.rn + staffByType.pn + staffByType.na).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Productivity Result */}
            <div className=" bg-filter-section bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg p-8 mb-6 text-white break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-primary">5. ผลผลิต</h3>
              <div className="bg-filter-section p-6 rounded-lg backdrop-blur-sm">
                <p className="text-center mb-2 font-semibold text-primary">
                  {/* ✅ แก้ไข: เรียกใช้ actualStaff ได้แล้วหลังจากประกาศตัวแปรข้างบน */}
                  ({adultWorkload.toFixed(2)} + {childWorkload.toFixed(2)}) × 100 ÷ ( {staffRequired.toFixed(2)} × 7) =
                </p>
                <p className="text-center text-5xl font-bold text-primary">
                  {productivity.toFixed(2)}%
                </p>
                <p className="text-center mt-4 text-sm txet-primary">
                  {productivity < 80 ? '⚠️ ต่ำ - ทรัพยากรเกิน' : productivity > 120 ? '⚠️ สูง - ทรัพยากรขาด' : '✅ ปกติ'}
                </p>
              </div>
            </div>

            {/* Print & Download Buttons */}
            <div className="flex justify-center gap-4 no-print pb-10">
              <button 
                onClick={handlePrint}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-5 rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <img src="/PRINTER.png" alt="printer" className='w-10 h-10' />
              </button>
              
              <button 
                onClick={exportToExcel}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-5 rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <img src="/EXCEL.png" alt="excel" className='w-10 h-10' />
                
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}