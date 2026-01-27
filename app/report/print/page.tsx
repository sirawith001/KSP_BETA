'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';



interface Category {
  catid: number;
  catname: string;
}

interface WardInfo {
  wardname: string;
  warduser: string;
}

interface WorkAdd {
  wid?: number; 
  wdates: string;
  catid: number;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  wa1?: number; wa2?: number;
  wa11?: number; wa22?: number;
  wdc1?: number; wdc2?: number; wdc3?: number; wdc4?: number; wdc5?: number;
  wdc6?: number; wdc7?: number;
  wdc11?: number; wdc22?: number; wdc33?: number; 
  wdc44?: number; wdc55?: number; wdc66?: number; wdc77?: number;
  wn1?: number;
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
  [key: string]: any;
}

interface GroupedWorkAdd extends WorkAdd {
  ws1: number; ws2: number; ws3: number; ws4: number; ws5: number;
  ws6: number; ws7: number; ws8: number; ws9: number; ws10: number;
  wa1: number; wa2: number;
  wa11: number; wa22: number;
  wdc1: number; wdc2: number; wdc3: number; wdc4: number; wdc5: number; wdc6: number; wdc7: number;
  wdc11: number; wdc22: number; wdc33: number; wdc44: number; wdc55: number; wdc66: number; wdc77: number;
  wn1: number;
  wrn1: number; wrn2: number;
  wpn1: number; wpn2: number;
  wna1: number; wna2: number;
}

interface DisplayInfo {
  m: string;
  y: string;
}

function PrintContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wardInfo, setWardInfo] = useState<WardInfo>({ wardname: '', warduser: '' });
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>({ m: '', y: '' });

  useEffect(() => {
    const initPrintPage = async () => {
      const wardid = searchParams.get('wardid');
      const month = searchParams.get('month');
      const year = searchParams.get('year');

      if (!wardid || !month || !year) return;

      try {
        const catRes = await fetch('/api/workcat');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const user = JSON.parse(savedUserInfo);
          setWardInfo({
            wardname: user.wardname || '',
            warduser: user.warduser || ''
          });
        }

        const gregYear = parseInt(year) - 543;
        const params = new URLSearchParams({
          wardid: wardid,
          month: month,
          year: gregYear.toString(),
        });

        const response = await fetch(`/api/workadd?${params}`);
        const data = await response.json();

        if (data.success) {
          setWorkAdds(data.data);
          setDisplayInfo({
            m: getThaiMonthName(parseInt(month)),
            y: year
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading print data:', error);
        setLoading(false);
      }
    };
    initPrintPage();
  }, [searchParams]);

  const getThaiMonthName = (monthIndex: number) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[monthIndex - 1] || '-';
  };

  const getDisplayWardName = () => {
    if (wardInfo.wardname) return wardInfo.wardname;
    return wardInfo.warduser || '-';
  };

  const calculateTotalMain = (data: WorkAdd) => (data.ws1||0)+(data.ws2||0)+(data.ws3||0)+(data.ws4||0)+(data.ws5||0);
  const calculateTotalGhost = (data: WorkAdd) => (data.ws6||0)+(data.ws7||0)+(data.ws8||0)+(data.ws9||0)+(data.ws10||0);

  const groupAndSortData = (data: WorkAdd[]): GroupedWorkAdd[] => {
    const grouped: { [key: string]: GroupedWorkAdd } = {};
    
    data.forEach(item => {
      const date = new Date(item.wdates);
      const dateKey = date.toISOString().split('T')[0];
      const shiftKey = `${dateKey}-${item.catid}`;
      
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
          wn1: 0, wrn1: 0, wrn2: 0, wpn1: 0, wpn2: 0, wna1: 0, wna2: 0
        };
      }
      
      const current = grouped[shiftKey];
      current.ws1 += (item.ws1 || 0); current.ws2 += (item.ws2 || 0);
      current.ws3 += (item.ws3 || 0); current.ws4 += (item.ws4 || 0);
      current.ws5 += (item.ws5 || 0);
      current.ws6 += (item.ws6 || 0); current.ws7 += (item.ws7 || 0);
      current.ws8 += (item.ws8 || 0); current.ws9 += (item.ws9 || 0);
      current.ws10 += (item.ws10 || 0);
      current.wa1 += (item.wa1 || 0); current.wa11 += (item.wa11 || 0);
      current.wa2 += (item.wa2 || 0); current.wa22 += (item.wa22 || 0);
      current.wdc1 += (item.wdc1 || 0); current.wdc11 += (item.wdc11 || 0);
      current.wdc2 += (item.wdc2 || 0); current.wdc22 += (item.wdc22 || 0);
      current.wdc3 += (item.wdc3 || 0); current.wdc33 += (item.wdc33 || 0);
      current.wdc4 += (item.wdc4 || 0); current.wdc44 += (item.wdc44 || 0);
      current.wdc5 += (item.wdc5 || 0); current.wdc55 += (item.wdc55 || 0);
      current.wdc6 += (item.wdc6 || 0); current.wdc66 += (item.wdc66 || 0);
      current.wdc7 += (item.wdc7 || 0); current.wdc77 += (item.wdc77 || 0);
      current.wn1 += (item.wn1 || 0);
      current.wrn1 += (item.wrn1 || 0); current.wrn2 += (item.wrn2 || 0);
      current.wpn1 += (item.wpn1 || 0); current.wpn2 += (item.wpn2 || 0);
      current.wna1 += (item.wna1 || 0); current.wna2 += (item.wna2 || 0);
    });
    
    return Object.values(grouped).sort((a, b) => {
      const dateCompare = new Date(a.wdates).getTime() - new Date(b.wdates).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.catid - b.catid;
    });
  };

  const getRowSpanForDate = (data: GroupedWorkAdd[], currentIndex: number) => {
    const currentDate = new Date(data[currentIndex].wdates).toDateString();
    let count = 1;
    for (let i = currentIndex + 1; i < data.length; i++) {
      if (new Date(data[i].wdates).toDateString() === currentDate) { count++; } 
      else { break; }
    }
    return count;
  };

  const isFirstRowOfDate = (data: GroupedWorkAdd[], currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentDate = new Date(data[currentIndex].wdates).toDateString();
    const prevDate = new Date(data[currentIndex - 1].wdates).toDateString();
    return currentDate !== prevDate;
  };

  const RenderDouble = ({ main, ghost }: { main?: number, ghost?: number }) => {
    const m = main || 0;
    const g = ghost || 0;
    return (
      <div className="flex items-center justify-center whitespace-nowrap">
        <span className={m > 0 ? "font-bold text-black" : "text-black"}>
          {m}
        </span>
        <span className="text-black ml-0.5 text-[12px]">({g})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">กำลังเตรียมข้อมูลสำหรับพิมพ์...</div>
        </div>
      </div>
    );
  }

  const groupedData = groupAndSortData(workAdds);

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-black">
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          table { font-size: 10px; width: 100%; }
          .min-h-screen { padding: 0; }
        }
        @media screen {
           .print-container { max-width: 1400px; margin: 0 auto; }
        }
      `}</style>

      <div className="print-container">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">
            สรุปยอดภาระงานหอผู้ป่วย [ {getDisplayWardName()} ]
          </h1>
          <h2 className="text-lg font-bold">
            ประจำเดือน {displayInfo.m} พ.ศ. {displayInfo.y}
          </h2>
        </div>

        <div className="w-full">
          <table className="w-full text-xs text-black border-collapse border border-black">
            <thead className="text-center font-bold bg-gray-200">
              <tr>
                <th rowSpan={3} className="border border-black px-1 py-1 w-[40px]">วันที่</th>
                <th rowSpan={3} className="border border-black px-1 py-1 w-[50px]">เวร</th>
                <th colSpan={5} className="border border-black px-1 py-1">ระดับความรุนแรงผู้ป่วย</th>
                <th rowSpan={3} className="border border-black px-1 py-1 w-[40px]">รวม</th>
                <th colSpan={2} className="border border-black px-1 py-1">Admit</th>
                <th colSpan={7} className="border border-black px-1 py-1">D/C</th>
                <th colSpan={7} className="border border-black px-1 py-1">อัตรากำลังผล</th>
              </tr>
              <tr>
                <th rowSpan={2} className="border border-black px-1 py-1">ระดับ1</th>
                <th rowSpan={2} className="border border-black px-1 py-1">ระดับ2</th>
                <th rowSpan={2} className="border border-black px-1 py-1">ระดับ3</th>
                <th rowSpan={2} className="border border-black px-1 py-1">ระดับ4</th>
                <th rowSpan={2} className="border border-black px-1 py-1">ระดับ5</th>
                
                <th rowSpan={2} className="border border-black px-1 py-1">รับใหม่</th>
                <th rowSpan={2} className="border border-black px-1 py-1">รับย้าย</th>
                
                <th colSpan={2} className="border border-black px-1 py-1">ย้ายไป</th>
                <th rowSpan={2} className="border border-black px-1 py-1">จำหน่าย</th>
                <th rowSpan={2} className="border border-black px-1 py-1">Refer</th>
                <th rowSpan={2} className="border border-black px-1 py-1">ไม่สมัคร<br/>ใจรักษา</th>
                <th rowSpan={2} className="border border-black px-1 py-1">หนี</th>
                <th rowSpan={2} className="border border-black px-1 py-1">เสียชีวิต</th>

                <th rowSpan={2} className="border border-black px-1 py-1">Head<br/>ward</th>
                <th colSpan={2} className="border border-black px-1 py-1">RN</th>
                <th colSpan={2} className="border border-black px-1 py-1">PN</th>
                <th colSpan={2} className="border border-black px-1 py-1">NA</th>
              </tr>
              <tr>
                <th className="border border-black px-1 py-1">ward</th>
                <th className="border border-black px-1 py-1">ICU</th>
                <th className="border border-black px-1 py-1">ปกติ</th>
                <th className="border border-black px-1 py-1">เสริม</th>
                <th className="border border-black px-1 py-1">ปกติ</th>
                <th className="border border-black px-1 py-1">เสริม</th>
                <th className="border border-black px-1 py-1">ปกติ</th>
                <th className="border border-black px-1 py-1">เสริม</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan={27} className="border border-black px-4 py-8 text-center text-gray-500">
                    ไม่พบข้อมูลสำหรับเดือนที่เลือก
                  </td>
                </tr>
              ) : (
                groupedData.map((item, index) => {
                  const isFirstRow = isFirstRowOfDate(groupedData, index);
                  const rowSpan = isFirstRow ? getRowSpanForDate(groupedData, index) : 0;
                  // ✅ ใส่สีสลับแถวที่นี่
                  const rowColor = index % 2 === 0 ? 'bg-[#EBF1DE]' : 'bg-[#FFFFCC]';
                  
                  return (
                    <tr key={index} className={`text-center ${rowColor}`}>
                      {/* ✅ แก้ไขจุด Hydration Error: ใช้ ? : null และไม่เว้นวรรคระหว่างปีกกา */}
                      {isFirstRow ? (
                        <td rowSpan={rowSpan} className="border border-black px-1 py-1 text-xs font-bold align-middle bg-white">
                           {new Date(item.wdates).getDate()}
                        </td>
                      ) : null}
                      
                      <td className="border border-black px-1 py-1">
                        {categories.find(c => c.catid === item.catid)?.catname || '-'}
                      </td>

                      <td className="border border-black px-1 py-1"><RenderDouble main={item.ws1} ghost={item.ws6} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.ws2} ghost={item.ws7} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.ws3} ghost={item.ws8} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.ws4} ghost={item.ws9} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.ws5} ghost={item.ws10} /></td>
                      
                      <td className="border border-black px-1 py-1 font-bold bg-white/50">
                        <RenderDouble main={calculateTotalMain(item)} ghost={calculateTotalGhost(item)} />
                      </td>

                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wa1} ghost={item.wa11} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wa2} ghost={item.wa22} /></td>

                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc1} ghost={item.wdc11} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc4} ghost={item.wdc44} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc2} ghost={item.wdc22} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc3} ghost={item.wdc33} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc5} ghost={item.wdc55} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc6} ghost={item.wdc66} /></td>
                      <td className="border border-black px-1 py-1"><RenderDouble main={item.wdc7} ghost={item.wdc77} /></td>

                      <td className="border border-black px-1 py-1">{item.wn1 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wrn1 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wrn2 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wpn1 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wpn2 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wna1 || 0}</td>
                      <td className="border border-black px-1 py-1">{item.wna2 || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-right text-[10px] text-gray-500 no-print">
          พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
        </div>

        <div className="mt-8 flex justify-center gap-4 no-print">
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-lg transition">
            🖨️ พิมพ์เอกสาร
          </button>
          <button onClick={() => window.close()} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold shadow-lg transition">
            ❌ ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportPrintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}