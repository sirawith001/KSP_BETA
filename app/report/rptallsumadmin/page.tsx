'use client';
import React, { useState, useEffect } from 'react';

interface WorkAdd {
  wid: number;
  catid: number;
  wardid?: number;
  wdates: string;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  wa1?: number; wa11?: number; wa2?: number; wa22?: number;
  wdc1?: number; wdc11?: number; wdc4?: number; wdc44?: number;
  wdc2?: number; wdc22?: number; wdc3?: number; wdc33?: number;
  wdc5?: number; wdc55?: number; wdc6?: number; wdc66?: number;
  wdc7?: number; wdc77?: number;
  wn1?: number;
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
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

export default function PrintReportPage() {
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardName, setWardName] = useState('-');
  const [displayDate, setDisplayDate] = useState('-');
  const [monthName, setMonthName] = useState('-');
  const [year, setYear] = useState('-');

  useEffect(() => {
    // Add class to hide layout elements
    document.body.classList.add('print-mode');
    
    const fetchData = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const wardid = urlParams.get('wardid');
        const date = urlParams.get('date');
        const month = urlParams.get('month');
        const yearParam = urlParams.get('year');

        if (!wardid || !date || !month || !yearParam) {
          alert('ข้อมูลไม่ครบถ้วน (ต้องมี wardid, date, month, year)');
          return;
        }

        // Fetch categories and wards
        const [catRes, wardRes] = await Promise.all([
          fetch('/api/workcat'),
          fetch('/api/warduser')
        ]);

        const catData = await catRes.json();
        const wardData = await wardRes.json();

        if (catData.success) setCategories(catData.data);
        if (wardData.success) {
          const cleanWards = wardData.data.filter((w: Ward) =>
            w.wardid !== 7 && w.wardid !== 9 && w.wardid !== 10 && w.wardid !== 11
          );
          setWards(cleanWards);
          
          // Set ward name - support both single ward and ALL wards
          if (wardid === 'ALL') {
            setWardName('ทุกหอผู้ป่วย');
          } else {
            const ward = cleanWards.find((w: Ward) => w.wardid === parseInt(wardid));
            setWardName(ward?.wardname || ward?.warduser || '-');
          }
        }

        // Convert year to Gregorian
        const buddhYear = parseInt(yearParam);
        const gregYear = buddhYear - 543;

        // Fetch work data for the specific date
        const workParams = new URLSearchParams({
          date: date,
          month: month,
          year: gregYear.toString()
        });

        // Add wardid only if not ALL
        if (wardid !== 'ALL') {
          workParams.append('wardid', wardid);
        }

        const workRes = await fetch(`/api/workadd?${workParams}`);
        const workData = await workRes.json();

        if (workData.success) {
          const sortedData = (workData.data || []).sort((a: WorkAdd, b: WorkAdd) => {
            // Sort by catid first, then by wardid
            if (a.catid !== b.catid) return a.catid - b.catid;
            return (a.wardid || 0) - (b.wardid || 0);
          });
          setWorkAdds(sortedData);
        }

        // Set display info
        setDisplayDate(date);
        setMonthName(getThaiMonthName(parseInt(month)));
        setYear(yearParam);

        setLoading(false);

        // Auto print after data loads
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

  const getWardNameById = (wid: number | undefined) => {
    if (!wid) return wardName;
    const w = wards.find(ward => ward.wardid === wid);
    return w?.wardname || w?.warduser || '-';
  };

  const calculateRowTotal = (item: WorkAdd) => {
    const normal = (item.ws1 || 0) + (item.ws2 || 0) + (item.ws3 || 0) + (item.ws4 || 0) + (item.ws5 || 0);
    const extra = (item.ws6 || 0) + (item.ws7 || 0) + (item.ws8 || 0) + (item.ws9 || 0) + (item.ws10 || 0);
    return { normal, extra };
  };

  const calculateGroupTotal = (items: WorkAdd[]) => {
    let total = {
      ws1: 0, ws2: 0, ws3: 0, ws4: 0, ws5: 0,
      ws6: 0, ws7: 0, ws8: 0, ws9: 0, ws10: 0,
      sumNormal: 0, sumExtra: 0,
      wa1: 0, wa11: 0, wa2: 0, wa22: 0,
      wdc1: 0, wdc11: 0, wdc4: 0, wdc44: 0,
      wdc2: 0, wdc22: 0, wdc3: 0, wdc33: 0,
      wdc5: 0, wdc55: 0, wdc6: 0, wdc66: 0, wdc7: 0, wdc77: 0,
      wn1: 0, wrn1: 0, wrn2: 0,
      wpn1: 0, wpn2: 0, wna1: 0, wna2: 0
    };

    items.forEach(item => {
      total.ws1 += item.ws1 || 0; total.ws6 += item.ws6 || 0;
      total.ws2 += item.ws2 || 0; total.ws7 += item.ws7 || 0;
      total.ws3 += item.ws3 || 0; total.ws8 += item.ws8 || 0;
      total.ws4 += item.ws4 || 0; total.ws9 += item.ws9 || 0;
      total.ws5 += item.ws5 || 0; total.ws10 += item.ws10 || 0;

      const rowT = calculateRowTotal(item);
      total.sumNormal += rowT.normal;
      total.sumExtra += rowT.extra;

      total.wa1 += item.wa1 || 0; total.wa11 += item.wa11 || 0;
      total.wa2 += item.wa2 || 0; total.wa22 += item.wa22 || 0;

      total.wdc1 += item.wdc1 || 0; total.wdc11 += item.wdc11 || 0;
      total.wdc4 += item.wdc4 || 0; total.wdc44 += item.wdc44 || 0;
      total.wdc2 += item.wdc2 || 0; total.wdc22 += item.wdc22 || 0;
      total.wdc3 += item.wdc3 || 0; total.wdc33 += item.wdc33 || 0;
      total.wdc5 += item.wdc5 || 0; total.wdc55 += item.wdc55 || 0;
      total.wdc6 += item.wdc6 || 0; total.wdc66 += item.wdc66 || 0;
      total.wdc7 += item.wdc7 || 0; total.wdc77 += item.wdc77 || 0;

      total.wn1 += item.wn1 || 0;
      total.wrn1 += item.wrn1 || 0; total.wrn2 += item.wrn2 || 0;
      total.wpn1 += item.wpn1 || 0; total.wpn2 += item.wpn2 || 0;
      total.wna1 += item.wna1 || 0; total.wna2 += item.wna2 || 0;
    });

    return total;
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

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <div className="print-container">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-1">
            สรุปยอดภาระงานประจำวันที่ {displayDate} เดือน {monthName} พ.ศ. {year}
          </h1>
          <h2 className="text-lg font-semibold text-gray-700">
            {wardName}
          </h2>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-[9px] text-black border-collapse border border-black" style={{ minWidth: '100%' }}>
            <thead className="text-center font-bold bg-gray-200">
              <tr>
                <th rowSpan={3} className="border border-black px-0.5 py-1 text-[9px]">เวร</th>
                <th rowSpan={3} className="border border-black px-0.5 py-1 text-[9px]">หอผู้ป่วย</th>
                <th colSpan={5} className="border border-black px-0.5 py-1 text-[9px]">ระดับความรุนแรงผู้ป่วย</th>
                <th rowSpan={3} className="border border-black px-0.5 py-1 text-[9px]">รวม</th>
                <th colSpan={2} className="border border-black px-0.5 py-1 text-[9px]">Admit</th>
                <th colSpan={7} className="border border-black px-0.5 py-1 text-[9px]">D/C</th>
                <th colSpan={7} className="border border-black px-0.5 py-1 text-[9px]">อัตรากำลัง</th>
                <th rowSpan={3} className="border border-black px-0.5 py-1 text-[9px]">วันที่</th>
              </tr>
              <tr>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ระดับ1</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ระดับ2</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ระดับ3</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ระดับ4</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ระดับ5</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">รับใหม่</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">รับย้าย</th>
                <th colSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ย้ายไป</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">จำหน่าย</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">Refer</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">ไม่สมัครใจ</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">หนี</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">เสียชีวิต</th>
                <th rowSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">Head</th>
                <th colSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">RN</th>
                <th colSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">PN</th>
                <th colSpan={2} className="border border-black px-0.5 py-0.5 text-[8px]">NA</th>
              </tr>
              <tr>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">ward</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">ICU</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">ปกติ</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">เสริม</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">ปกติ</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">เสริม</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">ปกติ</th>
                <th className="border border-black px-0.5 py-0.5 text-[7px]">เสริม</th>
              </tr>
            </thead>

            <tbody>
              {workAdds.length === 0 ? (
                <tr>
                  <td colSpan={25} className="border border-black px-4 py-8 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                Array.from(new Set(workAdds.map(w => w.catid)))
                  .sort((a, b) => a - b)
                  .map((catId) => {
                    const groupItems = workAdds
                      .filter(w => w.catid === catId)
                      .sort((a, b) => (a.wardid || 0) - (b.wardid || 0));

                    const groupTotal = calculateGroupTotal(groupItems);
                    const catName = categories.find(c => c.catid === catId)?.catname || '-';

                    return (
                      <React.Fragment key={catId}>
                        {groupItems.map((item, index) => {
                          const total = calculateRowTotal(item);
                          const dateObj = new Date(item.wdates);
                          const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear() + 543}`;
                          const rowWardName = item.wardid ? getWardNameById(item.wardid) : wardName;

                          return (
                            <tr key={`${item.wid}-${index}`} className="hover:bg-gray-50">
                              <td className="border border-black px-0.5 py-0.5 text-center font-semibold text-[9px]">{catName}</td>
                              <td className="border border-black px-0.5 py-0.5 text-left font-semibold text-[9px]">{rowWardName}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.ws1 || 0}({item.ws6 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.ws2 || 0}({item.ws7 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.ws3 || 0}({item.ws8 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.ws4 || 0}({item.ws9 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.ws5 || 0}({item.ws10 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center font-semibold bg-gray-100 text-[9px]">{total.normal}({total.extra})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wa1 || 0}({item.wa11 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wa2 || 0}({item.wa22 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc1 || 0}({item.wdc11 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc4 || 0}({item.wdc44 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc2 || 0}({item.wdc22 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc3 || 0}({item.wdc33 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc5 || 0}({item.wdc55 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc6 || 0}({item.wdc66 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wdc7 || 0}({item.wdc77 || 0})</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wn1 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wrn1 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wrn2 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wpn1 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wpn2 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wna1 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{item.wna2 || 0}</td>
                              <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{dateStr}</td>
                            </tr>
                          );
                        })}

                        <tr className="bg-orange-200 font-bold">
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">รวม</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-blue-800 text-[9px]">({catName})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.ws1}({groupTotal.ws6})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.ws2}({groupTotal.ws7})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.ws3}({groupTotal.ws8})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.ws4}({groupTotal.ws9})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.ws5}({groupTotal.ws10})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.sumNormal}({groupTotal.sumExtra})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wa1}({groupTotal.wa11})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wa2}({groupTotal.wa22})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc1}({groupTotal.wdc11})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc4}({groupTotal.wdc44})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc2}({groupTotal.wdc22})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc3}({groupTotal.wdc33})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc5}({groupTotal.wdc55})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc6}({groupTotal.wdc66})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wdc7}({groupTotal.wdc77})</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wn1}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wrn1}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wrn2}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wpn1}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wpn2}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wna1}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]">{groupTotal.wna2}</td>
                          <td className="border border-black px-0.5 py-0.5 text-center text-[9px]"></td>
                        </tr>
                      </React.Fragment>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 no-print text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            พิมพ์รายงาน
          </button>
          <button
            onClick={() => window.close()}
            className="ml-4 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}