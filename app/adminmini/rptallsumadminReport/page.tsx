'use client';

import { useState, useEffect } from 'react';

// ==================== Color Config ====================
const fieldColors: Record<string, string> = {
  'ws1': 'text-ws1', 'ws2': 'text-ws2', 'ws3': 'text-ws3',
  'ws4': 'text-ws4', 'ws5': 'text-ws5', 'ws6': 'text-ws6',
  'ws7': 'text-ws7', 'ws8': 'text-ws8', 'ws9': 'text-ws9',
  'ws10': 'text-ws10', 'wa1': 'text-wn1', 'wa11': 'text-wa11',
  'wa2': 'text-wa2', 'wa22': 'text-wa22', 'wdc1': 'text-wdc1',
  'wdc11': 'text-wdc11', 'wdc2': 'text-wdc2', 'wdc22': 'text-wdc22',
  'wdc3': 'text-wdc3', 'wdc33': 'text-wdc33', 'wdc4': 'text-wdc4',
  'wdc44': 'text-wdc44', 'wdc5': 'text-wdc5', 'wdc55': 'text-wdc55',
  'wdc6': 'text-wdc6', 'wdc66': 'text-wdc66', 'wdc7': 'text-wdc7',
  'wdc77': 'text-wdc77'
};

const ColoredValue = ({ field1, value1, field2, value2 }: { 
  field1: string; value1: number; field2?: string; value2?: number; 
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

// ==================== Interfaces ====================
interface Category {
  catid?: number;
  catname?: string;
  catnameopd?: string;
  catnameer?: string;
}

interface Ward {
  wardid: number;
  wardname: string;
  warddest?: string;
}

interface OpdItem {
  wardid?: number;
  category?: Category;
  wopderg1?: number;
  wopderg2?: number;
  wopderg3?: number;
  wopderg4?: number;
  wopderg5?: number;
  wopderg6?: string;
}

interface WorkAddItem {
  wardid: number;
  ward?: Ward;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  ws6?: number; ws7?: number; ws8?: number; ws9?: number; ws10?: number;
  wa1?: number; wa11?: number; wa2?: number; wa22?: number;
  wdc1?: number; wdc11?: number; wdc2?: number; wdc22?: number;
  wdc3?: number; wdc33?: number; wdc4?: number; wdc44?: number;
  wdc5?: number; wdc55?: number; wdc6?: number; wdc66?: number;
  wdc7?: number; wdc77?: number;
}

export default function ImprovedNursingReport() {
  const [workAdds, setWorkAdds] = useState<WorkAddItem[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [fullDateText, setFullDateText] = useState('');
  const [opdData, setOpdData] = useState<{ er: OpdItem[]; opd: OpdItem[] }>({ er: [], opd: [] });

  // ==================== Init ====================
  useEffect(() => {
    const initPage = async () => {
      try {
        const wardRes = await fetch('/api/warduser');
        const wardData = await wardRes.json();
        if (wardData.success) {
          setWards(wardData.data);
        }
      } catch (err) { 
        console.error(err); 
      }
    };
    initPage();
  }, []);

  // ==================== Helper Functions ====================
  const formatFullThaiDate = (day: string, month: string, yearBE: string) => {
    if (!day || !month || !yearBE) return '';
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const daysOfWeek = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const yearAD = parseInt(yearBE) - 543;
    const dateObj = new Date(yearAD, parseInt(month) - 1, parseInt(day));
    const dayName = daysOfWeek[dateObj.getDay()];
    const monthName = months[parseInt(month) - 1];
    return `วัน${dayName}ที่ ${day} เดือน${monthName} พ.ศ.${yearBE}`;
  };

  const calculateTotalPatient = (item: WorkAddItem) => {
    return (
      (item.ws1 || 0) + (item.ws2 || 0) + (item.ws3 || 0) + (item.ws4 || 0) + (item.ws5 || 0) +
      (item.ws6 || 0) + (item.ws7 || 0) + (item.ws8 || 0) + (item.ws9 || 0) + (item.ws10 || 0)
    );
  };

  const getSumCell = (keyMain: string, keySub: string) => {
    const sumMain = workAdds.reduce((acc, item) => acc + ((item as any)[keyMain] || 0), 0);
    const sumSub = workAdds.reduce((acc, item) => acc + ((item as any)[keySub] || 0), 0);
    return { main: sumMain, sub: sumSub };
  };

  const getTotalPatientsSum = () => {
    return workAdds.reduce((sum, item) => sum + calculateTotalPatient(item), 0);
  };

  // ==================== Search ====================
  const handleSearch = async () => {
    if (!selectedDate || !selectedMonth || !selectedYear) {
      alert("กรุณาเลือก วันที่, เดือน และ ปี ให้ครบถ้วน");
      return;
    }
    const formattedDate = formatFullThaiDate(selectedDate, selectedMonth, selectedYear);
    setFullDateText(formattedDate);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const buddhYear = parseInt(selectedYear);
      const gregYear = buddhYear - 543;
      
      const params = new URLSearchParams({
        date: selectedDate,
        month: selectedMonth,
        year: gregYear.toString(),
        catid: '3',
      });
      
      const response = await fetch(`/api/workadds?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkAdds(data.data || []);
        
        const opdResponse = await fetch(`/api/workopder?${params}`);
        const opdResult = await opdResponse.json();
        
        if (opdResult.success) {
          const erData = opdResult.data.filter((item: OpdItem) => item.wardid === 9);
          const opdDataList = opdResult.data.filter((item: OpdItem) => item.wardid === 10);
          setOpdData({ er: erData, opd: opdDataList });
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  // ==================== Print Function ====================
  const handlePrint = () => {
    const printContent = document.getElementById('printable-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>รายงานพยาบาลเวรตรวจการ</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
              th { background-color: #D9D9D9; border: 1px solid black; padding: 5px; text-align: center; font-weight: bold; }
              td { border: 1px solid black; padding: 4px; text-align: center; }
              .bg-orange-200 { background-color: #FED7AA !important; font-weight: bold; }
              .bg-gray-300 { background-color: #D1D5DB !important; font-weight: bold; }
              .text-left { text-align: left !important; }
              h1, h2 { text-align: center; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert("Pop-up blocked. Please allow pop-ups for this site.");
    }
  };

  // ==================== Excel Export Function ====================
  const handleDownloadExcel = async () => {
    // Dynamic import ExcelJS
    const ExcelJS = await import('exceljs');
    const { saveAs } = await import('file-saver');
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    
    const borderStyle: any = { 
      top: { style: 'thin' }, left: { style: 'thin' }, 
      bottom: { style: 'thin' }, right: { style: 'thin' } 
    };
    
    const headerFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; 
    const summaryFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
    const alignCenter: any = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const alignLeft: any = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // Title
    sheet.mergeCells('A1:R1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'รายงานเหตุการณ์งานบริการทางการพยาบาล (นอกเวลาราชการ) รพ.ค่ายสรรพสิทธิประสงค์';
    titleCell.alignment = alignCenter;
    titleCell.font = { bold: true, size: 14 };

    sheet.mergeCells('A2:R2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = fullDateText;
    dateCell.alignment = alignCenter;
    dateCell.font = { bold: true, size: 12 };

    sheet.addRow([]);
    sheet.addRow(['เรื่อง   รายงานพยาบาลเวรตรวจการ']);
    sheet.addRow(['เรียน   ผอ.รพ.ค่ายสรรพสิทธิประสงค์']);
    sheet.addRow([]);

    // Table 1: OPD/ER
    sheet.addRow(['1. สรุปยอดผู้ป่วยนอก']);
    const headerRow = sheet.addRow(['บริการ', 'รับตรวจ', 'หัตถการ', 'รับป่วย', 'ส่งต่อ', 'เสียชีวิต', 'หมายเหตุ']);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = borderStyle;
      cell.alignment = alignCenter;
      cell.font = { bold: true };
    });

    opdData.er.forEach(item => {
      const row = sheet.addRow([
        item.category?.catnameopd || '-',
        item.wopderg1 || 0, item.wopderg2 || 0, item.wopderg3 || 0,
        item.wopderg4 || 0, item.wopderg5 || 0, item.wopderg6 || ''
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = colNumber === 1 ? alignLeft : alignCenter;
      });
    });

    const sumOpdRow = sheet.addRow([
      'รวม (OPD)', 
      opdData.er.reduce((s, i) => s + (i.wopderg1||0), 0),
      opdData.er.reduce((s, i) => s + (i.wopderg2||0), 0),
      opdData.er.reduce((s, i) => s + (i.wopderg3||0), 0),
      opdData.er.reduce((s, i) => s + (i.wopderg4||0), 0),
      opdData.er.reduce((s, i) => s + (i.wopderg5||0), 0),
      ''
    ]);
    sumOpdRow.eachCell(cell => {
      cell.border = borderStyle;
      cell.fill = headerFill;
      cell.font = { bold: true };
      cell.alignment = alignCenter;
    });

    sheet.addRow([]);

    opdData.opd.forEach(item => {
      const row = sheet.addRow([
        item.category?.catnameer || '-',
        item.wopderg1 || 0, item.wopderg2 || 0, item.wopderg3 || 0,
        item.wopderg4 || 0, item.wopderg5 || 0, item.wopderg6 || ''
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = colNumber === 1 ? alignLeft : alignCenter;
      });
    });

    const sumErRow = sheet.addRow([
      'รวม (ER)', 
      opdData.opd.reduce((s, i) => s + (i.wopderg1||0), 0),
      opdData.opd.reduce((s, i) => s + (i.wopderg2||0), 0),
      opdData.opd.reduce((s, i) => s + (i.wopderg3||0), 0),
      opdData.opd.reduce((s, i) => s + (i.wopderg4||0), 0),
      opdData.opd.reduce((s, i) => s + (i.wopderg5||0), 0),
      ''
    ]);
    sumErRow.eachCell(cell => {
      cell.border = borderStyle;
      cell.fill = headerFill;
      cell.font = { bold: true };
      cell.alignment = alignCenter;
    });

    sheet.addRow([]);

    // Table 2: In-Patient (simplified header)
    sheet.addRow(['2. สรุปยอดผู้ป่วยใน']);
    const ipHeader = sheet.addRow([
      'ลำดับ', 'ตึก', 'จำนวนเตียง', 'จำนวนผู้ป่วย',
      'ระดับ1', 'ระดับ2', 'ระดับ3', 'ระดับ4', 'ระดับ5',
      'รับใหม่', 'รับย้าย', 'ย้ายWard', 'ย้ายICU',
      'จำหน่าย', 'Refer', 'ไม่สมัครใจ', 'หนี', 'เสียชีวิต'
    ]);
    ipHeader.eachCell(cell => {
      cell.fill = headerFill;
      cell.border = borderStyle;
      cell.alignment = alignCenter;
      cell.font = { bold: true };
    });

    workAdds.forEach((item, index) => {
      const wardName = wards.find(w => w.wardid === item.wardid)?.wardname || '-';
      const row = sheet.addRow([
        index + 1, wardName, item.ward?.warddest || '0', calculateTotalPatient(item),
        `${item.ws1||0}(${item.ws6||0})`, `${item.ws2||0}(${item.ws7||0})`,
        `${item.ws3||0}(${item.ws8||0})`, `${item.ws4||0}(${item.ws9||0})`,
        `${item.ws5||0}(${item.ws10||0})`, `${item.wa1||0}(${item.wa11||0})`,
        `${item.wa2||0}(${item.wa22||0})`, `${item.wdc1||0}(${item.wdc11||0})`,
        `${item.wdc4||0}(${item.wdc44||0})`, `${item.wdc2||0}(${item.wdc22||0})`,
        `${item.wdc3||0}(${item.wdc33||0})`, `${item.wdc5||0}(${item.wdc55||0})`,
        `${item.wdc6||0}(${item.wdc66||0})`, `${item.wdc7||0}(${item.wdc77||0})`
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = colNumber === 2 ? alignLeft : alignCenter;
      });
    });

    if (workAdds.length > 0) {
      const totalRow = sheet.addRow([
        'รวม', '',
        workAdds.reduce((sum, item) => sum + parseInt(item.ward?.warddest || '0'), 0),
        getTotalPatientsSum(),
        `${getSumCell('ws1','ws6').main}(${getSumCell('ws1','ws6').sub})`,
        `${getSumCell('ws2','ws7').main}(${getSumCell('ws2','ws7').sub})`,
        `${getSumCell('ws3','ws8').main}(${getSumCell('ws3','ws8').sub})`,
        `${getSumCell('ws4','ws9').main}(${getSumCell('ws4','ws9').sub})`,
        `${getSumCell('ws5','ws10').main}(${getSumCell('ws5','ws10').sub})`,
        `${getSumCell('wa1','wa11').main}(${getSumCell('wa1','wa11').sub})`,
        `${getSumCell('wa2','wa22').main}(${getSumCell('wa2','wa22').sub})`,
        `${getSumCell('wdc1','wdc11').main}(${getSumCell('wdc1','wdc11').sub})`,
        `${getSumCell('wdc4','wdc44').main}(${getSumCell('wdc4','wdc44').sub})`,
        `${getSumCell('wdc2','wdc22').main}(${getSumCell('wdc2','wdc22').sub})`,
        `${getSumCell('wdc3','wdc33').main}(${getSumCell('wdc3','wdc33').sub})`,
        `${getSumCell('wdc5','wdc55').main}(${getSumCell('wdc5','wdc55').sub})`,
        `${getSumCell('wdc6','wdc66').main}(${getSumCell('wdc6','wdc66').sub})`,
        `${getSumCell('wdc7','wdc77').main}(${getSumCell('wdc7','wdc77').sub})`
      ]);
      sheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
      totalRow.eachCell(cell => {
        cell.border = borderStyle;
        cell.fill = summaryFill;
        cell.font = { bold: true };
        cell.alignment = alignCenter;
      });
    }

    sheet.columns = Array(18).fill({ width: 12 });
    sheet.getColumn(2).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `รายงานพยาบาลเวร_${fullDateText || 'report'}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-page p-2 font-sans text-primary opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* ==================== Search Section Responsive ==================== */}
        <div className="text-center mb-6 no-print px-4 md:px-0">
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-primary">รายงานพยาบาลเวรตรวจการ</h1>
          
          <div className="flex justify-center">
            {/* Container: Mobile = Vertical Stack, Desktop = Horizontal Row */}
            <div className="bg-filter-section flex flex-col md:flex-row items-center gap-3 bg-gradient-to-r from-green-50 to-lime-50 px-4 py-4 rounded-xl border border-blue-200 shadow-sm w-full md:w-auto max-w-3xl">
              
              {/* 1. Label Section */}
              <div className="flex items-center gap-2 self-start md:self-center mb-2 md:mb-0">
                <div className="p-1.5  rounded-full shadow-sm">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-primary whitespace-nowrap">วันที่บันทึก</span>
              </div>
              
              {/* 2. Inputs Group: Grid on Mobile / Flex on Desktop */}
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center">
                
                {/* Day Select */}
                <select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full md:w-20 bg-white text-gray-800 border border-blue-200 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
                >
                  <option value="">วันที่</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>

                {/* Month Select */}
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-1 w-full md:w-32 bg-white text-gray-800 border border-blue-200 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
                >
                  <option value="">เดือน</option>
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                    <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}-{m}</option>
                  ))}
                </select>

                {/* Year Select - Full width on mobile grid (col-span-2) */}
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg col-span-2 md:col-span-1 w-full md:w-auto bg-white text-gray-800 border border-blue-200 rounded-lg px-2 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
                >
                  <option value="">ปี พ.ศ. [ค.ศ.]</option>
                  {Array.from({ length: 30 }, (_, i) => {
                    const thYear = 2572 - i;
                    const enYear = thYear - 543;
                    return <option key={thYear} value={thYear}>{thYear}-[{enYear}]</option>;
                  })}
                </select>
              </div>

              {/* 3. Search Button */}
              <button 
                onClick={handleSearch} 
                className="duration-500 hover:-translate-y-1 hover:shadow-lg w-full md:w-auto bg-gradient-header text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-md transform hover:scale-105 transition-all mt-2 md:mt-0"
              >
                ตกลง
              </button>

            </div>
          </div>
        </div>

        {/* ==================== Report Content ==================== */}
        <div id="printable-content">

          <div id="printable-content">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold">
                รายงานเหตุการณ์งานบริการทางการพยาบาล (นอกเวลาราชการ) รพ.ค่ายสรรพสิทธิประสงค์
              </h2><br />
              <div className="text-base font-bold">{fullDateText}</div>
              <br />
            </div>

            <div className="mb-4 text-sm font-bold pl-2">
              <div className="flex gap-4">
                <span className="min-w-[60px]">เรื่อง</span>
                <span>รายงานพยาบาลเวรตรวจการ</span>
              </div>
              <br />
              <div className="flex gap-4">
                <span className="min-w-[60px]">เรียน</span>
                <span>ผอ.รพ.ค่ายสรรพสิทธิประสงค์</span>
              </div>
            </div>

            {/* ========== 1. OPD/ER Table ========== */}
            <div className="mb-6">
              <h2 className="text-sm font-bold mb-1">1. สรุปยอดผู้ป่วยนอก</h2>
              <div className="overflow-x-auto border-t-2 border-black">
                <table className="w-full text-xs text-black border-collapse border border-black">
                  <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                    <tr>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-slate-600 to-slate-700 min-w-[150px]">บริการ</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-blue-600 to-blue-700">รับตรวจ</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-green-600 to-green-700">หัตถการ</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-purple-600 to-purple-700">รับป่วย</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-orange-600 to-orange-700">ส่งต่อ</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-red-600 to-red-700">เสียชีวิต</th>
                      <th className="border-2 border-slate-500/30 px-3 py-3 bg-gradient-to-br from-slate-600 to-slate-700 min-w-[150px]">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* OPD Section */}
                    {opdData.er.map((item, index) => (
                      <tr key={`opd-${index}`} className="hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all">
                        <td className="border border-black px-2 py-1.5 text-left font-semibold bg-white">
                          {item.category?.catnameopd || item.category?.catname || '-'}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center bg-white">
                          <span className="text-ws1 font-semibold">{item.wopderg1 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center bg-white">
                          <span className="text-ws7 font-semibold">{item.wopderg2 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center bg-white">
                          <span className="text-wa22 font-semibold">{item.wopderg3 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center bg-white">
                          <span className="text-ws9 font-semibold">{item.wopderg4 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center bg-red-50 bg-white">
                          <span className="text-ws10 font-semibold">{item.wopderg5 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-left text-gray-600 bg-white">{item.wopderg6 || ''}</td>
                      </tr>
                    ))}
                    
                    {/* OPD Summary */}
                    <tr className="bg-gradient-to-r from-blue-100 to-blue-200 font-bold border-2 border-blue-400">
                      <td className="border border-black px-2 py-1.5 text-center text-blue-800">รวม (OPD)</td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws1">
                        {opdData.er.reduce((s, i) => s + (i.wopderg1||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws7">
                        {opdData.er.reduce((s, i) => s + (i.wopderg2||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-wa22">
                        {opdData.er.reduce((s, i) => s + (i.wopderg3||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws9">
                        {opdData.er.reduce((s, i) => s + (i.wopderg4||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws10">
                        {opdData.er.reduce((s, i) => s + (i.wopderg5||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5"></td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={7} className="h-2 bg-gray-100 border-none"></td></tr>

                    {/* ER Section */}
                    {opdData.opd.map((item, index) => (
                      <tr key={`er-${index}`} className="hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all bg-white">
                        <td className="border border-black px-2 py-1.5 text-left font-semibold">
                          {item.category?.catnameer || item.category?.catname || '-'}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <span className="text-ws1 font-semibold">{item.wopderg1 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <span className="text-ws7 font-semibold">{item.wopderg2 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <span className="text-wa22 font-semibold">{item.wopderg3 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <span className="text-ws9 font-semibold">{item.wopderg4 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <span className="text-ws10 font-semibold">{item.wopderg5 || 0}</span>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-left text-gray-600">{item.wopderg6 || ''}</td>
                      </tr>
                    ))}
                    
                    {/* ER Summary */}
                    <tr className="bg-gradient-to-r from-red-100 to-orange-200 font-bold border-2 border-red-400">
                      <td className="border border-black px-2 py-1.5 text-center text-red-800">รวม (ER)</td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws1">
                        {opdData.opd.reduce((s, i) => s + (i.wopderg1||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws7">
                        {opdData.opd.reduce((s, i) => s + (i.wopderg2||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-wa22">
                        {opdData.opd.reduce((s, i) => s + (i.wopderg3||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws9">
                        {opdData.opd.reduce((s, i) => s + (i.wopderg4||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-ws10">
                        {opdData.opd.reduce((s, i) => s + (i.wopderg5||0), 0)}
                      </td>
                      <td className="border border-black px-2 py-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========== 2. In-Patient Table ========== */}
            <div className="mb-6">
              <h2 className="text-sm font-bold mb-1">2. สรุปยอดผู้ป่วยใน</h2>
              <div className="overflow-x-auto border-t-2 border-black">
                <table className="w-full text-xs text-black border-collapse border border-black">
                  <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                    <tr>
                      <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 bg-gradient-to-br from-slate-600 to-slate-700">ลำดับ</th>
                      <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 bg-gradient-to-br from-slate-600 to-slate-700">ตึก</th>
                      <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 bg-gradient-to-br from-slate-600 to-slate-700">จำนวน<br />เตียง</th>
                      <th rowSpan={3} className="border-2 border-slate-500/30 px-2 py-3 bg-gradient-to-br from-slate-600 to-slate-700">จำนวน<br />ผู้ป่วย</th>
                      <th colSpan={5} className="bg-gradient-row1 bg-gradient-to-r from-blue-600 to-cyan-500 border-2 border-blue-400/50 px-2 py-3 shadow-lg">ระดับความรุนแรงผู้ป่วย</th>
                      <th colSpan={2} className="bg-gradient-row2 bg-gradient-to-r from-emerald-600 to-green-500 border-2 border-emerald-400/50 px-2 py-3 shadow-lg">Admit</th>
                      <th colSpan={7} className="bg-gradient-row3 bg-gradient-to-r from-purple-600 to-pink-500 border-2 border-purple-400/50 px-2 py-3 shadow-lg">D/C</th>
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
                    </tr>
                    <tr>
                      <th className="border border-gray-400 px-2 py-2 font-normal">Ward</th>
                      <th className="border border-gray-400 px-2 py-2 font-normal">ICU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workAdds.length === 0 ? (
                      <tr><td colSpan={18} className="py-4 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
                    ) : (
                      workAdds.map((item, index) => {
                        const wardName = wards.find(w => w.wardid === item.wardid)?.wardname || '-';
                        return (
                          <tr key={index} className="hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all bg-white">
                            <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                            <td className="border border-black px-2 py-1 text-left">{wardName}</td>
                            <td className="border border-black px-2 py-1 text-center">{item.ward?.warddest || '0'}</td>
                            <td className="border border-black px-2 py-1 text-center font-bold">{calculateTotalPatient(item)}</td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="ws1" value1={item.ws1 || 0} field2="ws6" value2={item.ws6 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="ws2" value1={item.ws2 || 0} field2="ws7" value2={item.ws7 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="ws3" value1={item.ws3 || 0} field2="ws8" value2={item.ws8 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="ws4" value1={item.ws4 || 0} field2="ws9" value2={item.ws9 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="ws5" value1={item.ws5 || 0} field2="ws10" value2={item.ws10 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wa1" value1={item.wa1 || 0} field2="wa11" value2={item.wa11 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wa2" value1={item.wa2 || 0} field2="wa22" value2={item.wa22 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wdc1" value1={item.wdc1 || 0} field2="wdc11" value2={item.wdc11 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wdc4" value1={item.wdc4 || 0} field2="wdc44" value2={item.wdc44 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wdc2" value1={item.wdc2 || 0} field2="wdc22" value2={item.wdc22 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wdc3" value1={item.wdc3 || 0} field2="wdc33" value2={item.wdc33 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <ColoredValue field1="wdc5" value1={item.wdc5 || 0} field2="wdc55" value2={item.wdc55 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center ">
                              <ColoredValue field1="wdc6" value1={item.wdc6 || 0} field2="wdc66" value2={item.wdc66 || 0} />
                            </td>
                            <td className="border border-black px-2 py-1 text-center ">
                              <ColoredValue field1="wdc7" value1={item.wdc7 || 0} field2="wdc77" value2={item.wdc77 || 0} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                    
                    {workAdds.length > 0 && (
                      <tr className="bg-orange-200 font-bold">
                        <td colSpan={2} className="border border-black px-2 py-1 text-center">รวม</td>
                        <td className="border border-black px-2 py-1 text-center">
                          {workAdds.reduce((sum, item) => sum + parseInt(item.ward?.warddest || '0'), 0)}
                        </td>
                        <td className="border border-black px-2 py-1 text-center">{getTotalPatientsSum()}</td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="ws1" value1={getSumCell('ws1', 'ws6').main} field2="ws6" value2={getSumCell('ws1', 'ws6').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="ws2" value1={getSumCell('ws2', 'ws7').main} field2="ws7" value2={getSumCell('ws2', 'ws7').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="ws3" value1={getSumCell('ws3', 'ws8').main} field2="ws8" value2={getSumCell('ws3', 'ws8').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="ws4" value1={getSumCell('ws4', 'ws9').main} field2="ws9" value2={getSumCell('ws4', 'ws9').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="ws5" value1={getSumCell('ws5', 'ws10').main} field2="ws10" value2={getSumCell('ws5', 'ws10').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wa1" value1={getSumCell('wa1', 'wa11').main} field2="wa11" value2={getSumCell('wa1', 'wa11').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wa2" value1={getSumCell('wa2', 'wa22').main} field2="wa22" value2={getSumCell('wa2', 'wa22').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wdc1" value1={getSumCell('wdc1', 'wdc11').main} field2="wdc11" value2={getSumCell('wdc1', 'wdc11').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wdc4" value1={getSumCell('wdc4', 'wdc44').main} field2="wdc44" value2={getSumCell('wdc4', 'wdc44').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wdc2" value1={getSumCell('wdc2', 'wdc22').main} field2="wdc22" value2={getSumCell('wdc2', 'wdc22').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wdc3" value1={getSumCell('wdc3', 'wdc33').main} field2="wdc33" value2={getSumCell('wdc3', 'wdc33').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center">
                          <ColoredValue field1="wdc5" value1={getSumCell('wdc5', 'wdc55').main} field2="wdc55" value2={getSumCell('wdc5', 'wdc55').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center ">
                          <ColoredValue field1="wdc6" value1={getSumCell('wdc6', 'wdc66').main} field2="wdc66" value2={getSumCell('wdc6', 'wdc66').sub} />
                        </td>
                        <td className="border border-black px-2 py-1 text-center ">
                          <ColoredValue field1="wdc7" value1={getSumCell('wdc7', 'wdc77').main} field2="wdc77" value2={getSumCell('wdc7', 'wdc77').sub} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
         </div>

        {/* ==================== Action Buttons ==================== */}
        {workAdds.length > 0 && (
          <div className="flex justify-center gap-3 mt-4 no-print">
             <button 
                  onClick={handleDownloadExcel}
                  className="bg-green-600 text-white px-5 py-5 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  <img src="/EXCEL.png" alt="excel" className='w-9 h-9' />
                </button>
                <button 
                  onClick={handlePrint}
                  className="bg-gray-600 text-white px-5 py-5 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  <img src="/PRINTER.png" alt="printer" className='w-9 h-9' />
                </button>
          </div>
        )}

      </div>
    </div>
  );
}