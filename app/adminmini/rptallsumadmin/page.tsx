'use client';
import React from 'react';
import { useState, useEffect, useMemo, Fragment } from 'react';

// ==================== 0. Color Config ====================
const fieldColors: Record<string, string> = {
  'ws1': 'text-ws1',
  'ws2': 'text-ws2', 
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
  'wna2': 'text-wna2',
  'sumNormal':'text-ws1-5'
};

// ==================== Component for colored dual values ====================
const ColoredValue = ({ 
  field1, 
  value1, 
  field2, 
  value2 
}: { 
  field1: string; 
  value1: number; 
  field2?: string; 
  value2?: number; 
}) => {
  if (field2 && value2 !== undefined) {
    return (
      <>
        <span className={`${fieldColors[field1]} font-semibold`}>{value1}</span>
        <span className="text-gray-500">(</span>
        <span className={`${fieldColors[field2]} font-semibold`}>{value2}</span>
        <span className="text-gray-500">)</span>
      </>
    );
  }
  return <span className={`${fieldColors[field1]} font-semibold`}>{value1}</span>;
};

// ==================== 1. Interfaces ====================
interface User {
  role: string;
  wardid?: number;
  [key: string]: any;
}

interface WorkAdd {
  wid: number;
  catid: number;
  wardid?: number;
  wdates: string;
  
  // --- เวรปกติ (Normal) ---
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  // --- เวรเสริม (Extra/OT) ---
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;

  // --- Admit (มักจะมีตัวเลขย่อยหรือวงเล็บ) ---
  wa1?: number; wa11?: number; 
  wa2?: number; wa22?: number;

  // --- D/C ---
  wdc1?: number; wdc11?: number;
  wdc4?: number; wdc44?: number;
  wdc2?: number; wdc22?: number;
  wdc3?: number; wdc33?: number;
  wdc5?: number; wdc55?: number;
  wdc6?: number; wdc66?: number;
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

export default function RptAllSumAdminPage() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workAdds, setWorkAdds] = useState<WorkAdd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [displayDateInfo, setDisplayDateInfo] = useState({ d: '-', m: '-', y: '-' });
  const [displayWardName, setDisplayWardName] = useState('-');

  // ==================== Init ====================
  useEffect(() => {
    const initPage = async () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) {
        // window.location.href = '/login'; // Uncomment ในโปรเจคจริง
        setUserInfo({ role: 'ADMIN' }); // Mock
      } else {
        const user = JSON.parse(savedUserInfo);
        setUserInfo(user);
      }

      try {
        const [catRes, wardRes] = await Promise.all([
            fetch('/api/workcat'),
            fetch('/api/warduser')
        ]);
        
        // 1. แปลงเป็น JSON
        const catData = await catRes.json();
        const wardData = await wardRes.json(); 

        // 2. เช็ค success
        if (catData.success) setCategories(catData.data);
        
        // 3. แก้ตรงนี้: ใช้ wardData แทน wardRes
        if (wardData.success) {
           // แก้ตรงนี้ด้วย: wardData.data
           const cleanWards = wardData.data.filter((w: Ward) =>  
             w.wardid !== 7 && w.wardid !== 9 && w.wardid !== 10 && w.wardid !== 11
           );
           setWards(cleanWards);
        }
      } catch (err) {
        console.error('Error fetching initial data', err);
      }
      setLoading(false);
    };
    initPage();
  }, []);

  // ==================== Search Logic ====================
  const handleSearch = async () => {
    if ((!selectedWardId && selectedWardId !== 'ALL') || !selectedDate || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือกข้อมูลให้ครบถ้วน");
      return;
    }
    
    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      
      const params = new URLSearchParams({
        date: selectedDate,
        month: selectedMonth,
        year: gregYear.toString(),
      });
      
      if (selectedWardId !== 'ALL') {
        params.append('wardid', selectedWardId);
      }
      
      const response = await fetch(`/api/workadd?${params}`);
      const data = await response.json();
      
      if (data.success) {
      
        const sortedData = (data.data || []).sort((a: WorkAdd, b: WorkAdd) => a.catid - b.catid);
        setWorkAdds(sortedData);

        setDisplayDateInfo({
          d: selectedDate,
          m: getThaiMonthName(parseInt(selectedMonth)),
          y: selectedYear
        });
        
        if (selectedWardId === 'ALL') {
             setDisplayWardName('ทุกหอผู้ป่วย');
        } else {
            const selectedWard = wards.find(w => w.wardid === parseInt(selectedWardId));
            setDisplayWardName(selectedWard?.wardname || selectedWard?.warduser || '-');
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  // ==================== Logic Calculations ====================
  
  // คำนวณยอดรวมรายแถว (Normal และ Extra)
  const calculateRowTotal = (item: WorkAdd) => {
    const normal = (item.ws1 || 0) + (item.ws2 || 0) + (item.ws3 || 0) + (item.ws4 || 0) + (item.ws5 || 0);
    const extra = (item.ws6 || 0) + (item.ws7 || 0) + (item.ws8 || 0) + (item.ws9 || 0) + (item.ws10 || 0);
    return { normal, extra };
  };

  // คำนวณยอดรวมทั้งหมด (Grand Total) สำหรับแถวล่างสุด
  const grandTotal = useMemo(() => {
    if (workAdds.length === 0) return null;
    
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

    workAdds.forEach(item => {
        // Normal Levels
        total.ws1 += item.ws1 || 0; total.ws6 += item.ws6 || 0;
        total.ws2 += item.ws2 || 0; total.ws7 += item.ws7 || 0;
        total.ws3 += item.ws3 || 0; total.ws8 += item.ws8 || 0;
        total.ws4 += item.ws4 || 0; total.ws9 += item.ws9 || 0;
        total.ws5 += item.ws5 || 0; total.ws10 += item.ws10 || 0;

        // Sum Row
        const rowT = calculateRowTotal(item);
        total.sumNormal += rowT.normal;
        total.sumExtra += rowT.extra;

        // Admit
        total.wa1 += item.wa1 || 0; total.wa11 += item.wa11 || 0;
        total.wa2 += item.wa2 || 0; total.wa22 += item.wa22 || 0;
        
        // D/C
        total.wdc1 += item.wdc1 || 0; total.wdc11 += item.wdc11 || 0;
        total.wdc4 += item.wdc4 || 0; total.wdc44 += item.wdc44 || 0;
        total.wdc2 += item.wdc2 || 0; total.wdc22 += item.wdc22 || 0;
        total.wdc3 += item.wdc3 || 0; total.wdc33 += item.wdc33 || 0;
        total.wdc5 += item.wdc5 || 0; total.wdc55 += item.wdc55 || 0;
        total.wdc6 += item.wdc6 || 0; total.wdc66 += item.wdc66 || 0;
        total.wdc7 += item.wdc7 || 0; total.wdc77 += item.wdc77 || 0;
        
        // Others
        total.wn1 += item.wn1 || 0;
        total.wrn1 += item.wrn1 || 0;
        total.wrn2 += item.wrn2 || 0;
        

        total.wpn1 += item.wpn1 || 0; total.wpn2 += item.wpn2 || 0;
        total.wna1 += item.wna1 || 0; total.wna2 += item.wna2 || 0;
    });

    return total;
  }, [workAdds]);

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
        // Normal Levels
        total.ws1 += item.ws1 || 0; total.ws6 += item.ws6 || 0;
        total.ws2 += item.ws2 || 0; total.ws7 += item.ws7 || 0;
        total.ws3 += item.ws3 || 0; total.ws8 += item.ws8 || 0;
        total.ws4 += item.ws4 || 0; total.ws9 += item.ws9 || 0;
        total.ws5 += item.ws5 || 0; total.ws10 += item.ws10 || 0;

        // Sum Row
        const rowT = calculateRowTotal(item);
        total.sumNormal += rowT.normal;
        total.sumExtra += rowT.extra;

        // Admit
        total.wa1 += item.wa1 || 0; total.wa11 += item.wa11 || 0;
        total.wa2 += item.wa2 || 0; total.wa22 += item.wa22 || 0;
        
        // D/C
        total.wdc1 += item.wdc1 || 0; total.wdc11 += item.wdc11 || 0;
        total.wdc4 += item.wdc4 || 0; total.wdc44 += item.wdc44 || 0;
        total.wdc2 += item.wdc2 || 0; total.wdc22 += item.wdc22 || 0;
        total.wdc3 += item.wdc3 || 0; total.wdc33 += item.wdc33 || 0;
        total.wdc5 += item.wdc5 || 0; total.wdc55 += item.wdc55 || 0;
        total.wdc6 += item.wdc6 || 0; total.wdc66 += item.wdc66 || 0;
        total.wdc7 += item.wdc7 || 0; total.wdc77 += item.wdc77 || 0;
        
        // Others
        total.wn1 += item.wn1 || 0;
        total.wrn1 += item.wrn1 || 0; total.wrn2 += item.wrn2 || 0;
        total.wpn1 += item.wpn1 || 0; total.wpn2 += item.wpn2 || 0;
        total.wna1 += item.wna1 || 0; total.wna2 += item.wna2 || 0;
    });

    return total;
  };

  const getThaiMonthName = (monthIndex: number) => {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[monthIndex - 1] || '-';
  };

  const getWardNameById = (wid: number | undefined) => {
    if (!wid) return displayWardName;
    const w = wards.find(ward => ward.wardid === wid);
    return w?.wardname || w?.warduser || '-';
  }

  const handleDownloadExcel = async () => {
    // 1. Load Library
    if (!(window as any).XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];
    
    // 2. Prepare Header Rows
    wsData.push([`สรุปยอดภาระงานประจำวันที่ ${displayDateInfo.d} เดือน ${displayDateInfo.m} พ.ศ. ${displayDateInfo.y}`]);
    wsData.push([]); 
    wsData.push(['เวร', 'หอผู้ป่วย', 'ระดับความรุนแรงผู้ป่วย', '', '', '', '', 'รวม', 'Admit', '', 'D/C', '', '', '', '', '', '', 'อัตรากำลังผล', '', '', '', '', '','', 'วันที่-วดป.']);
    wsData.push(['', '', 'ระดับ1', 'ระดับ2', 'ระดับ3', 'ระดับ4', 'ระดับ5', '', 'รับใหม่', 'รับย้าย', 'ย้ายไป', '', 'จำหน่าย', 'Refer', 'ไม่สมัครใจรักษา', 'หนี', 'เสียชีวิต', 'Head ward', 'RN', '', 'PN', '', 'NA', '', '']);
    wsData.push(['', '', '', '', '', '', '', '', '', '', 'ward', 'ICU', '', '', '', '', '', '', 'ปกติ', 'เสริม', 'ปกติ', 'เสริม', 'ปกติ', 'เสริม', '']);
    
    // ==========================================================================================
    // 3. Prepare Data Rows (ปรับ Logic ใหม่: Group -> Sort -> Subtotal)
    // ==========================================================================================
    
    // 3.1 หาเวร (Category) ทั้งหมดที่มี
    const uniqueCats = Array.from(new Set(workAdds.map(w => w.catid))).sort((a,b) => a - b);

    uniqueCats.forEach(catId => {
        // 3.2 กรองและเรียงลำดับข้อมูลในเวรนั้น (เรียงตาม Ward ID)
        const groupItems = workAdds
            .filter(w => w.catid === catId)
            .sort((a, b) => (a.wardid || 0) - (b.wardid || 0));
        
        const groupTotal = calculateGroupTotal(groupItems); // ใช้ฟังก์ชันเดียวกับที่ทำใน React
        const catName = categories.find(c => c.catid === catId)?.catname || '-';

        // 3.3 วนลูปใส่ข้อมูลรายแถว
        groupItems.forEach(item => {
            let dateStr = '';
            try {
                const d = new Date(item.wdates);
                dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()+543}`;
            } catch(e) { dateStr = item.wdates; }

            const rowWardName = selectedWardId === 'ALL' && item.wardid ? getWardNameById(item.wardid) : displayWardName;
            const total = calculateRowTotal(item);

            wsData.push([
                catName, 
                rowWardName, 
                `${item.ws1 || 0}(${item.ws6 || 0})`, 
                `${item.ws2 || 0}(${item.ws7 || 0})`, 
                `${item.ws3 || 0}(${item.ws8 || 0})`, 
                `${item.ws4 || 0}(${item.ws9 || 0})`, 
                `${item.ws5 || 0}(${item.ws10 || 0})`,
                `${total.normal}(${total.extra})`, 
                
                `${item.wa1 || 0}(${item.wa11 || 0})`, 
                `${item.wa2 || 0}(${item.wa22 || 0})`, 
                
                `${item.wdc1 || 0}(${item.wdc11 || 0})`, 
                `${item.wdc4 || 0}(${item.wdc44 || 0})`, 
                `${item.wdc2 || 0}(${item.wdc22 || 0})`, 
                `${item.wdc3 || 0}(${item.wdc33 || 0})`,
                `${item.wdc5 || 0}(${item.wdc55 || 0})`, 
                `${item.wdc6 || 0}(${item.wdc66 || 0})`,
                `${item.wdc7 || 0}(${item.wdc77 || 0})`,
                `${item.wn1 || 0}`, 
                
                item.wrn1 || 0, item.wrn2 || 0, 
                item.wpn1 || 0, item.wpn2 || 0, 
                item.wna1 || 0, item.wna2 || 0, 
                dateStr
            ]);
        });

        // 3.4 ใส่แถว "รวม" ของเวรนั้น (Subtotal Row)
        wsData.push([
            'รวม', 
            `(${catName})`, // ช่องชื่อตึก ใส่เป็นวงเล็บชื่อเวรแทน
            `${groupTotal.ws1}(${groupTotal.ws6})`,
            `${groupTotal.ws2}(${groupTotal.ws7})`,
            `${groupTotal.ws3}(${groupTotal.ws8})`,
            `${groupTotal.ws4}(${groupTotal.ws9})`,
            `${groupTotal.ws5}(${groupTotal.ws10})`,
            `${groupTotal.sumNormal}(${groupTotal.sumExtra})`,
            `${groupTotal.wa1}(${groupTotal.wa11})`,
            `${groupTotal.wa2}(${groupTotal.wa22})`,
            `${groupTotal.wdc1}(${groupTotal.wdc11})`,
            `${groupTotal.wdc4}(${groupTotal.wdc44})`,
            `${groupTotal.wdc2}(${groupTotal.wdc22})`,
            `${groupTotal.wdc3}(${groupTotal.wdc33})`,
            `${groupTotal.wdc5}(${groupTotal.wdc55})`,
            `${groupTotal.wdc6}(${groupTotal.wdc66})`,
            `${groupTotal.wdc7}(${groupTotal.wdc77})`,
            `${groupTotal.wn1}`,
            groupTotal.wrn1, groupTotal.wrn2,
            groupTotal.wpn1, groupTotal.wpn2, 
            groupTotal.wna1, groupTotal.wna2, 
            ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // --- Styles Definitions ---
    const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    };

    const headerStyle = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "D3D3D3" } }, 
        border: borderStyle
    };

    const dataStyle = {
        font: { sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderStyle
    };
    
    const dataWardStyle = {
        font: { sz: 11 },
        alignment: { horizontal: "left", vertical: "center" }, 
        border: borderStyle
    };

    const totalStyle = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "FCCFB1" } }, // สีส้ม
        border: borderStyle
    };

    // Apply Styles Loop
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        // ตรวจสอบว่าเป็นแถว "รวม" หรือไม่ (เพื่อใส่สีส้ม)
        // ดูจากคอลัมน์แรก (Column 0) ของแถวนั้นว่ามีคำว่า "รวม" หรือ "รวมทั้งสิ้น" หรือไม่
        const firstColCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
        const isTotalRow = firstColCell && (firstColCell.v === 'รวม' || firstColCell.v === 'รวมทั้งสิ้น');

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            if (R === 0) {
                // Title
                ws[cellAddress].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
            } else if (R >= 2 && R <= 4) { 
                // Header
                ws[cellAddress].s = headerStyle;
            } else if (isTotalRow) {
                // Total Rows (ทั้ง Subtotal และ Grand Total จะเข้าเงื่อนไขนี้)
                ws[cellAddress].s = totalStyle;
            } else {
                // Normal Data
                ws[cellAddress].s = (C === 1) ? dataWardStyle : dataStyle;
            }
        }
    }
    
    // --- Merge Cells ---
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 24 } }, 
      { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } }, 
      { s: { r: 2, c: 1 }, e: { r: 4, c: 1 } }, 
      { s: { r: 2, c: 2 }, e: { r: 2, c: 6 } }, 
      { s: { r: 2, c: 7 }, e: { r: 4, c: 7 } },
      { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } }, 
      { s: { r: 2, c: 10 }, e: { r: 2, c: 16 } }, 
      { s: { r: 2, c: 17 }, e: { r: 2, c: 23 } }, 
      { s: { r: 2, c: 24 }, e: { r: 4, c: 24 } }, 

      // Sub-headers Row 3
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, 
      { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }, { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }, 
      { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } }, 
      { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } }, { s: { r: 3, c: 10 }, e: { r: 3, c: 11 } }, 
      { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } }, { s: { r: 3, c: 13 }, e: { r: 4, c: 13 } }, 
      { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } }, { s: { r: 3, c: 15 }, e: { r: 4, c: 15 } }, 
      { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, { s: { r: 3, c: 17 }, e: { r: 4, c: 17 } }, 
      { s: { r: 3, c: 18 }, e: { r: 3, c: 19 } }, { s: { r: 3, c: 20 }, e: { r: 3, c: 21 } }, 
      { s: { r: 3, c: 22 }, e: { r: 3, c: 23 } },
    ];

    // Col Widths
    ws['!cols'] = [
        { wch: 8 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, 
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, 
        { wch: 10 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, 
        { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'สรุปภาระงาน');
    XLSX.writeFile(wb, `สรุปภาระงาน_${displayWardName}.xlsx`);
  };
  // ✅ ฟังก์ชันสั่งพิมพ์
  const handlePrint = () => {
    if (!selectedDate || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือก วันที่ เดือน และ ปี ให้ครบถ้วนก่อนพิมพ์");
      return;
    }
    const url = `/report/rptallsumadmin?wardid=${selectedWardId}&date=${selectedDate}&month=${selectedMonth}&year=${selectedYear}`;
    window.open(url, '_blank');
  };


  

  return (
    <div className="min-h-screen p-2 font-sans opacity-0 animate-fadeIn bg-gradient-page text-primary">

      <div className="max-w-[1400px] mx-auto">
        
        {/* ==================== Search UI Responsive ==================== */}
        <div className="text-center mb-6 no-print px-4 md:px-0">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-primary">
            สรุปยอดภาระงานประจำวันหอผู้ป่วย
          </h1>

          <div className="flex justify-center">
            {/* Main Container: Mobile = Vertical Column, Large Screen = Horizontal Row */}
            <div className="bg-filter-section flex flex-col lg:flex-row items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-5 rounded-xl border border-blue-200 shadow-md w-full lg:w-auto max-w-5xl">
              
              {/* --- Section 1: Date Selector --- */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {/* Label & Icon */}
                <div className="flex items-center gap-2 mb-1 sm:mb-0 min-w-fit">
                  <div className="p-1.5  rounded-full shadow-sm">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-bold text-primary whitespace-nowrap">วันที่</span>
                </div>

                {/* Date Inputs: Grid on Mobile / Flex on Desktop */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto lg:flex lg:items-center">
                  {/* Day */}
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full lg:w-20 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                  >
                    <option value="">วันที่</option>
                    {Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>

                  {/* Month */}
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full lg:w-32 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                  >
                    <option value="">เดือน</option>
                    {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                      <option key={i+1} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}-{m}</option>
                    ))}
                  </select>

                  {/* Year - Full width on mobile grid (col-span-2) */}
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
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full lg:w-48 bg-white text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:bg-sky-100 hover:text-black"
                >
                  <option value="">เลือกหอผู้ป่วย</option>
                  <option value="ALL">-- ดูทั้งหมด --</option>
                  {wards.map(ward => <option key={ward.wardid} value={ward.wardid}>{ward.wardname}</option>)}
                </select>
              </div>

              {/* --- Section 3: Button --- */}
              <button 
                onClick={handleSearch} 
                className="duration-500 hover:-translate-y-1  w-full lg:w-auto bg-gradient-header bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 hover:from-green-700 hover:to-lime-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all  hover:shadow-xl flex items-center justify-center gap-2 mt-2 lg:mt-0"
              >
                ตกลง
              </button>

            </div>
          </div>
        </div>

        {/* ==================== Result Table ==================== */}
        <div id="printable-content">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">
              สรุปยอดภาระงานประจำวันที่ {displayDateInfo.d} เดือน {displayDateInfo.m} พ.ศ. {displayDateInfo.y}
            </h2>
          </div>

          <div className="overflow-x-auto border-t-2 border-black">
            <table className="w-full text-xs text-black border-collapse border border-black">
              <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
                {/* Header Rows (เหมือนเดิม แต่ตรวจสอบความถูกต้อง) */}
                <tr>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[50px] bg-gradient-to-br from-slate-600 to-slate-700">เวร</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[50px] bg-gradient-to-br from-slate-600 to-slate-700">ตึก</th>
                  <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                  <th rowSpan={3} className="bg-gradient-row5 border-2 border-indigo-400/50 px-2 py-3 min-w-[50px] bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg">รวม</th>
                  <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                  <th colSpan={7} className="bg-gradient-row3 -gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
                  <th colSpan={7} className="bg-gradient-row4 -gradient-to-r from-amber-600 to-red-500 border-2 border-amber-400/50 px-2 py-3 shadow-lg">อัตรากำลังผล</th>
                  <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 min-w-[50px] bg-gradient-to-br from-slate-600 to-slate-700">วันที่ <br />วดป.</th>

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
                <tr><td colSpan={26} className="border border-black px-4 py-8 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
              ) : (
                // 1. วนลูปตามกลุ่มเวร (catid)
                Array.from(new Set(workAdds.map(w => w.catid)))
                  .sort((a,b) => a - b) // เรียงเวร เช้า -> บ่าย -> ดึก
                  .map((catId) => {
                  
                    // 2. ดึงข้อมูลเวรนั้น และเรียงตาม wardid
                    const groupItems = workAdds
                        .filter(w => w.catid === catId)
                        .sort((a, b) => (a.wardid || 0) - (b.wardid || 0)); // เรียงรหัสตึก
                    
                    const groupTotal = calculateGroupTotal(groupItems);
                    const catName = categories.find(c => c.catid === catId)?.catname || '-';

                  return (
                    <React.Fragment key={catId}> 
                    
                      {/* --- Loop รายการในกลุ่ม --- */}
                      {groupItems.map((item, index) => {
                        const total = calculateRowTotal(item);
                        return (
                          <tr key={`${item.wid}-${index}`} className="bg-white hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration">
                            <td className="border border-black px-1 py-1 text-center font-bold">{catName}</td>
                            <td className="border border-black px-1 py-1 text-center font-bold whitespace-nowrap">
                              {selectedWardId === 'ALL' && item.wardid ? getWardNameById(item.wardid) : displayWardName}
                            </td>
                            
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="ws1" value1={item.ws1 || 0} field2="ws6" value2={item.ws6 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="ws2" value1={item.ws2 || 0} field2="ws7" value2={item.ws7 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="ws3" value1={item.ws3 || 0} field2="ws8" value2={item.ws8 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="ws4" value1={item.ws4 || 0} field2="ws9" value2={item.ws9 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="ws5" value1={item.ws5 || 0} field2="ws10" value2={item.ws10 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center font-bold bg-blue-100 text-ws1-5">{total.normal}({total.extra})</td>

                            {/* Admit */}
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wa1" value1={item.wa1 || 0} field2="wa11" value2={item.wa11 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wa2" value1={item.wa2 || 0} field2="wa22" value2={item.wa22 || 0} />
                            </td>

                            {/* D/C */}
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wdc1" value1={item.wdc1 || 0} field2="wdc11" value2={item.wdc11 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wdc4" value1={item.wdc4 || 0} field2="wdc44" value2={item.wdc44 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wdc2" value1={item.wdc2 || 0} field2="wdc22" value2={item.wdc22 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wdc3" value1={item.wdc3 || 0} field2="wdc33" value2={item.wdc33 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wdc5" value1={item.wdc5 || 0} field2="wdc55" value2={item.wdc55 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center bg-red-50">
                              <ColoredValue field1="wdc6" value1={item.wdc6 || 0} field2="wdc66" value2={item.wdc66 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center bg-gray-200">
                              <ColoredValue field1="wdc7" value1={item.wdc7 || 0} field2="wdc77" value2={item.wdc77 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center bg-blue-100">
                              <ColoredValue field1="wn1" value1={item.wn1 || 0} />
                            </td>
                            
                            {/* Manpower */}
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wrn1" value1={item.wrn1 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wrn2" value1={item.wrn2 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wpn1" value1={item.wpn1 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wpn2" value1={item.wpn2 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wna1" value1={item.wna1 || 0} />
                            </td>
                            <td className="border border-black px-1 py-1 text-center">
                              <ColoredValue field1="wna2" value1={item.wna2 || 0} />
                            </td>
                            
                            <td className="border border-black px-1 py-1 text-center text-[10px] whitespace-nowrap">
                              {new Date(item.wdates).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                          </tr>
                        );
                      })}

                      {/* --- Row รวมยอดของกลุ่ม (Sub-Total) --- */}
                      <tr className=" bg-yellow-100 border border-red-400 font-bold">
                          <td className="border border-black px-1 py-1 text-center">รวม</td>
                          <td className="border border-black px-1 py-1 text-center text-blue-800">({catName})</td>
                          
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="ws1" value1={groupTotal.ws1} field2="ws6" value2={groupTotal.ws6} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="ws2" value1={groupTotal.ws2} field2="ws7" value2={groupTotal.ws7} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="ws3" value1={groupTotal.ws3} field2="ws8" value2={groupTotal.ws8} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="ws4" value1={groupTotal.ws4} field2="ws9" value2={groupTotal.ws9} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="ws5" value1={groupTotal.ws5} field2="ws10" value2={groupTotal.ws10} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center ">{groupTotal.sumNormal}({groupTotal.sumExtra}) </td>
                          
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wa1" value1={groupTotal.wa1} field2="wa11" value2={groupTotal.wa11} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wa2" value1={groupTotal.wa2} field2="wa22" value2={groupTotal.wa22} />
                          </td>
                          
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc1" value1={groupTotal.wdc1} field2="wdc11" value2={groupTotal.wdc11} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc4" value1={groupTotal.wdc4} field2="wdc44" value2={groupTotal.wdc44} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc2" value1={groupTotal.wdc2} field2="wdc22" value2={groupTotal.wdc22} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc3" value1={groupTotal.wdc3} field2="wdc33" value2={groupTotal.wdc33} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc5" value1={groupTotal.wdc5} field2="wdc55" value2={groupTotal.wdc55} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc6" value1={groupTotal.wdc6} field2="wdc66" value2={groupTotal.wdc66} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wdc7" value1={groupTotal.wdc7} field2="wdc77" value2={groupTotal.wdc77} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wn1" value1={groupTotal.wn1} />
                          </td>
                        
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wrn1" value1={groupTotal.wrn1} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wrn2" value1={groupTotal.wrn2} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wpn1" value1={groupTotal.wpn1} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wpn2" value1={groupTotal.wpn2} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wna1" value1={groupTotal.wna1} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center">
                            <ColoredValue field1="wna2" value1={groupTotal.wna2} />
                          </td>
                          <td className="border border-black px-1 py-1 text-center"></td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}

            </tbody>
            </table>
          </div>
        </div>
        
        {/* Buttons */}
        {workAdds.length > 0 && (
          <div className="flex justify-center gap-3 mt-4 no-print">
             <button 
                    onClick={handleDownloadExcel}
                    className="bg-green-600 text-white px-3 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                    <img src="/EXCEL.png" alt="excel" className='w-7 h-7' />
                </button>
                <button 
                    onClick={handlePrint}
                    className="bg-gray-600 text-white px-3 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  <img src="/PRINTER.png" alt="printer" className='w-7 h-7' />
                </button>
          </div>
        )}
      </div>
    </div>
  );
}