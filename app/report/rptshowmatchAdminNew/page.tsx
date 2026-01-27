'use client';
import React, { useState, useEffect } from 'react';

interface WorkAddItem {
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
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

interface Ward {
  wardid: number;
  wardname: string;
  warduser: string;
}

export default function ProductivityPrintPage() {
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAddItem[]>([]);
  const [wardName, setWardName] = useState('-');
  const [monthName, setMonthName] = useState('-');
  const [year, setYear] = useState('-');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const wardid = urlParams.get('wardid');
        const month = urlParams.get('month');
        const yearParam = urlParams.get('year');

        if (!wardid || !month || !yearParam) {
          alert('ข้อมูลไม่ครบถ้วน');
          return;
        }

        setSelectedMonth(month);
        setSelectedYear(yearParam);

        // Fetch ward info
        const wardRes = await fetch('/api/wards');
        const wardData = await wardRes.json();
        
        if (wardData.success) {
          const ward = wardData.data.find((w: Ward) => w.wardid === parseInt(wardid));
          setWardName(ward?.wardname || ward?.warduser || '-');
        }

        // Convert year
        const buddhYear = parseInt(yearParam);
        const gregYear = buddhYear - 543;

        // Fetch work data
        const workParams = new URLSearchParams({
          wardid: wardid,
          month: month,
          year: gregYear.toString()
        });

        const workRes = await fetch(`/api/workadd?${workParams}`);
        const workData = await workRes.json();

        if (workData.success) {
          setWorkAdds(workData.data || []);
        }

        setMonthName(getThaiMonthName(parseInt(month)));
        setYear(yearParam);
        setLoading(false);

        setTimeout(() => {
          window.print();
        }, 500);

      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getThaiMonthName = (monthIndex: number) => {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[monthIndex - 1] || '-';
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
      result.adult.level1 += Number(item.ws1 || 0);
      result.adult.level2 += Number(item.ws2 || 0);
      result.adult.level3 += Number(item.ws3 || 0);
      result.adult.level4 += Number(item.ws4 || 0);
      result.adult.level5 += Number(item.ws5 || 0);
      
      result.child.level1 += Number(item.ws6 || 0);
      result.child.level2 += Number(item.ws7 || 0);
      result.child.level3 += Number(item.ws8 || 0);
      result.child.level4 += Number(item.ws9 || 0);
      result.child.level5 += Number(item.ws10 || 0);
    });
    
    return result;
  };

  const calcAvgByLevel = (): AvgByLevelResult => {
    const numday = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear) - 543);
    const byLevel = calcByLevel();
    
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
    return (avg.adult.level5 * 1.5) + (avg.adult.level4 * 3.5) + (avg.adult.level3 * 5.5) + (avg.adult.level2 * 7.5) + (avg.adult.level1 * 12.5);
  };

  const calcChildWorkload = () => {
    const avg = calcAvgByLevel();
    return (avg.child.level5 * 1.5) + (avg.child.level4 * 3.5) + (avg.child.level3 * 5.5) + (avg.child.level2 * 7.5) + (avg.child.level1 * 12.5);
  };

  const calcFTE1 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    return (((sumA + sumC) * 1.4 * 1.3) / 7) || 0;
  };

  const calcFTE2 = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    return (((sumA + sumC) * 1.4) / 7) || 0;
  };

  const calcStaffRequiredPerDay = () => {
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    return ((sumA + sumC) * 1.14) / 7 || 0;
  };

  const calcStaffByType = () => {
    const total = calcStaffRequiredPerDay();
    return {
      rn: total * 0.65,
      pn: total * 0.25,
      na: total * 0.10
    };
  };

 const calcProductivity = () => {
    
    const sumA = calcAdultWorkload();
    const sumC = calcChildWorkload();
    const totalWorkload = sumA + sumC;

    if (totalWorkload === 0) return 0;
    const sumDA = (totalWorkload * 1.4) / 7;
    const sumL = (sumDA * 2080) / (365 * 7); // ได้จำนวนคนตามมาตรฐาน
    const qsum = sumL * 7; // แปลงเป็นชั่วโมง

    // คำนวณ
    return (totalWorkload * 100) / qsum;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">กำลังโหลดข้อมูล...</div>
          <div className="text-gray-600">กรุณารอสักครู่</div>
        </div>
      </div>
    );
  }

  const avgByLevel = calcAvgByLevel();
  const adultWorkload = calcAdultWorkload();
  const childWorkload = calcChildWorkload();
  
  const totalAdultAvg = Object.values(avgByLevel.adult).reduce((a, b) => a + b, 0);
  const totalChildAvg = Object.values(avgByLevel.child).reduce((a, b) => a + b, 0);

  const adultNHPPD = totalAdultAvg > 0 ? (adultWorkload / totalAdultAvg) : 0;
  const childNHPPD = totalChildAvg > 0 ? (childWorkload / totalChildAvg) : 0;

  const fte1 = calcFTE1();
  const fte2 = calcFTE2();
  const partTime = fte1 - fte2;
  const staffRequired = calcStaffRequiredPerDay();
  const staffByType = calcStaffByType();
  const productivity = calcProductivity();

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <style>{`
        body.print-mode nav,
        body.print-mode header,
        body.print-mode aside,
        body.print-mode .navbar,
        body.print-mode .sidebar,
        body.print-mode .layout-header {
          display: none !important;
        }
        
        body.print-mode {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        @media print {
          body { margin: 0; padding: 10mm; }
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          nav, header, aside, .navbar, .sidebar, .layout-header {
            display: none !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 break-inside-avoid">
          <h1 className="text-2xl font-bold mb-2">ตารางสรุปภาระงานรายเดือน</h1>
          <h2 className="text-xl font-semibold mb-1">{monthName} พ.ศ. {year}</h2>
          <h3 className="text-lg text-gray-700">{wardName}</h3>
        </div>

        {/* Section 1: ผู้ป่วยเฉลี่ย */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">1. ผู้ป่วยเฉลี่ย (ราย/วัน)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-300 p-3 rounded">
              <span className="font-semibold">ผู้ใหญ่:</span>
              <span className="ml-2 text-xl font-bold">{totalAdultAvg.toFixed(2)}</span>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <span className="font-semibold">เด็ก:</span>
              <span className="ml-2 text-xl font-bold">{totalChildAvg.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Section 2: แยกความประเมิน */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">แยกความประเมินและภาระงาน</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th rowSpan={2} className="border border-gray-300 px-3 py-2">ประเภท</th>
                <th colSpan={2} className="border border-gray-300 px-3 py-2">แยกตามประเภท (ราย/วัน)</th>
                <th colSpan={2} className="border border-gray-300 px-3 py-2">ชม.ความต้องการพยาบาล</th>
              </tr>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-3 py-2">ผู้ใหญ่</th>
                <th className="border border-gray-300 px-3 py-2">เด็ก</th>
                <th className="border border-gray-300 px-3 py-2">ผู้ใหญ่</th>
                <th className="border border-gray-300 px-3 py-2">เด็ก</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'ประเภท 5 (×1.5)', key: 'level5' as keyof LevelData, w: 1.5 },
                { name: 'ประเภท 4 (×3.5)', key: 'level4' as keyof LevelData, w: 3.5 },
                { name: 'ประเภท 3 (×5.5)', key: 'level3' as keyof LevelData, w: 5.5 },
                { name: 'ประเภท 2 (×7.5)', key: 'level2' as keyof LevelData, w: 7.5 },
                { name: 'ประเภท 1 (×12.5)', key: 'level1' as keyof LevelData, w: 12.5 }
              ].map(item => (
                <tr key={item.key}>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">{item.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{avgByLevel.adult[item.key].toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{avgByLevel.child[item.key].toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{(avgByLevel.adult[item.key] * item.w).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{(avgByLevel.child[item.key] * item.w).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: NHPPD */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">2. รวมจำนวนการพยาบาลเฉลี่ย/ราย/วัน</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold min-w-[60px]">ผู้ใหญ่ =</span>
              <span className="text-xs">
                    [{avgByLevel.adult.level5.toFixed(2)} × 1.5] + [{avgByLevel.adult.level4.toFixed(2)} × 3.5] + 
                    [{avgByLevel.adult.level3.toFixed(2)} × 5.5] + [{avgByLevel.adult.level2.toFixed(2)} × 7.5] + 
                    [{avgByLevel.adult.level1.toFixed(2)} × 12.5]
                  </span>
              <span className="font-bold text-lg">= {adultNHPPD.toFixed(2)}</span>
              <span>ชม./ราย/วัน</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold min-w-[60px]">เด็ก =</span>
              <span className="text-xs">
                    [{avgByLevel.child.level5.toFixed(2)} × 1.5] + [{avgByLevel.child.level4.toFixed(2)} × 3.5] +
                    [{avgByLevel.child.level3.toFixed(2)} × 5.5] + [{avgByLevel.child.level2.toFixed(2)} × 7.5] + 
                    [{avgByLevel.child.level1.toFixed(2)} × 12.5]
                  </span>
              <span className="font-bold text-lg">= {childNHPPD.toFixed(2)}</span>
              <span>ชม./ราย/วัน</span>
            </div>
          </div>
        </div>

        {/* Section 4: FTE */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">3. อัตรากำลัง</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border border-gray-300 p-3 rounded text-center">
              <div className="text-sm text-gray-600">FTE 1</div>
              <div className="text-2xl font-bold">{fte1.toFixed(2)}</div>
            </div>
            <div className="border border-gray-300 p-3 rounded text-center">
              <div className="text-sm text-gray-600">FTE 2</div>
              <div className="text-2xl font-bold">{fte2.toFixed(2)}</div>
            </div>
            <div className="border border-gray-300 p-3 rounded text-center">
              <div className="text-sm text-gray-600">Part Time</div>
              <div className="text-2xl font-bold">{partTime.toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold">อัตรากำลังที่ต้องการ/วัน:</span>
              <span className="text-2xl font-bold text-red-600">{staffRequired.toFixed(2)} คน</span>
            </div>
          </div>
        </div>

        {/* Section 5: การกระจาย */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">4. การกระจายอัตรากำลังต่อวันต่อเวร</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-3 py-2">ประเภท</th>
                <th className="border border-gray-300 px-3 py-2">สัดส่วน</th>
                <th className="border border-gray-300 px-3 py-2">เช้า (40%)</th>
                <th className="border border-gray-300 px-3 py-2">บ่าย (35%)</th>
                <th className="border border-gray-300 px-3 py-2">คืน (25%)</th>
                <th className="border border-gray-300 px-3 py-2">รวม</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'RN', key: 'rn' as keyof typeof staffByType, ratio: '65%' },
                { name: 'PN', key: 'pn' as keyof typeof staffByType, ratio: '25%' },
                { name: 'NA', key: 'na' as keyof typeof staffByType, ratio: '10%' }
              ].map(item => (
                <tr key={item.key}>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">{item.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{item.ratio}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{(staffByType[item.key] * 0.4).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{(staffByType[item.key] * 0.35).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{(staffByType[item.key] * 0.25).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">{staffByType[item.key].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Productivity */}
        <div className="bg-yellow-100 border-2 border-yellow-400 p-6 rounded-lg text-center break-inside-avoid">
          <h3 className="text-xl font-bold mb-2">5. ผลผลิต (Productivity)</h3>
          <div className="text-5xl font-bold text-gray-800">{productivity.toFixed(2)}%</div>
          <div className="mt-2 text-sm">
            {productivity < 80 ? '⚠️ ต่ำ - ทรัพยากรเกิน' : productivity > 120 ? '⚠️ สูง - ทรัพยากรขาด' : '✅ ปกติ'}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 text-center no-print space-x-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            พิมพ์รายงาน
          </button>
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}