'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Define interfaces for your data structures
interface WorkAdd {
  wid: number;
  catid: number;
  wdates: string;
  ws1?: number; ws2?: number; ws3?: number; ws4?: number; ws5?: number;
  wa1?: number; wa2?: number;
  wdc1?: number; wdc2?: number; wdc3?: number; wdc4?: number; wdc5?: number; wdc6?: number; wdc7?: number;
  wn1?: number;
  wrn1?: number; wrn2?: number;
  wpn1?: number; wpn2?: number;
  wna1?: number; wna2?: number;
}

interface DisplayDateInfo {
  d: string;
  m: string;
  y: string;
}

interface Category {
  catid: number;
  catname: string;
}

interface PrintData {
  workAdds: WorkAdd[];
  displayDateInfo: DisplayDateInfo;
  displayWardName: string;
  categories: Category[];
}

export default function PrintReportPage() {
  const router = useRouter();
  // Properly type the state to allow null or PrintData
  const [data, setData] = useState<PrintData | null>(null);

  useEffect(() => {
    // อ่านข้อมูลจาก localStorage
    const printDataStr = localStorage.getItem('printData');
    if (!printDataStr) {
      alert('ไม่พบข้อมูลสำหรับพิมพ์');
      window.close();
      return;
    }
    
    try {
        const printData: PrintData = JSON.parse(printDataStr);
        setData(printData);
        
        // พิมพ์อัตโนมัติหลังโหลดเสร็จ
        setTimeout(() => {
          window.print();
        }, 500);
    } catch (e) {
        console.error("Failed to parse print data", e);
        alert('ข้อมูลไม่ถูกต้อง');
        window.close();
    }
  }, []);

  const calculateTotal = (item: WorkAdd) => {
    return (item.ws1 || 0) + (item.ws2 || 0) + (item.ws3 || 0) + (item.ws4 || 0) + (item.ws5 || 0);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const { workAdds, displayDateInfo, displayWardName, categories } = data;

  return (
    <>
      <style jsx global>{`
        @page {
          size: landscape;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          background: white;
          padding: 10mm;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        
        th, td {
          border: 1px solid black;
          padding: 3px 2px;
          text-align: center;
        }
        
        th {
          background-color: #D9D9D9;
          font-weight: bold;
          font-size: 8px;
        }
        
        .bg-stripe {
          background-color: #EBF1DE;
        }
        
        .title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        
        @media print {
          table {
            font-size: 8px;
          }
          
          th {
            font-size: 7px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .bg-stripe {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div>
        {/* ปุ่มปิดหน้าต่าง */}
        <div className="no-print mb-4 flex justify-between items-center">
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🖨️ พิมพ์อีกครั้ง
          </button>
          <button 
            onClick={() => window.close()} 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            ✖️ ปิดหน้าต่าง
          </button>
        </div>

        {/* หัวข้อ */}
        <div className="title">
          สรุปยอดภาระงานประจำวันที่ {displayDateInfo.d} เดือน {displayDateInfo.m} พ.ศ. {displayDateInfo.y}
        </div>

        {/* ตาราง */}
        <table>
          <thead>
            {/* หัวตารางแถวที่ 1 */}
            <tr>
              <th rowSpan={3}>เวร</th>
              <th rowSpan={3}>หอผู้ป่วย</th>
              <th colSpan={5}>ระดับความรุนแรงผู้ป่วย</th>
              <th rowSpan={3}>รวม</th>
              <th colSpan={2}>Admit</th>
              <th colSpan={7}>D/C</th>
              <th colSpan={7}>อัตรากำลังผล</th>
              <th rowSpan={3}>วันที่-วดป.</th>
            </tr>
            
            {/* หัวตารางแถวที่ 2 */}
            <tr>
              <th rowSpan={2}>ระดับ1</th>
              <th rowSpan={2}>ระดับ2</th>
              <th rowSpan={2}>ระดับ3</th>
              <th rowSpan={2}>ระดับ4</th>
              <th rowSpan={2}>ระดับ5</th>
              <th rowSpan={2}>รับใหม่</th>
              <th rowSpan={2}>รับย้าย</th>
              <th colSpan={2}>ย้ายไป</th>
              <th rowSpan={2}>จำหน่าย</th>
              <th rowSpan={2}>Refer</th>
              <th rowSpan={2}>ไม่สมัครใจรักษา</th>
              <th rowSpan={2}>หนี</th>
              <th rowSpan={2}>เสียชีวิต</th>
              <th rowSpan={2}>Head ward</th>
              <th colSpan={2}>RN</th>
              <th colSpan={2}>PN</th>
              <th colSpan={2}>NA</th>
            </tr>
            
            {/* หัวตารางแถวที่ 3 */}
            <tr>
              <th>ward</th>
              <th>ICU</th>
              <th>ปกติ</th>
              <th>เสริม</th>
              <th>ปกติ</th>
              <th>เสริม</th>
              <th>ปกติ</th>
              <th>เสริม</th>
            </tr>
          </thead>
          
          <tbody>
            {workAdds.map((item, index) => (
              <tr key={item.wid} className={index % 2 === 0 ? '' : 'bg-stripe'}>
                <td style={{fontWeight: 'bold'}}>
                  {categories.find(c => c.catid === item.catid)?.catname || '-'}
                </td>
                <td style={{fontWeight: 'bold'}}>{displayWardName}</td>
                <td>{item.ws1 || 0}(0)</td>
                <td>{item.ws2 || 0}(0)</td>
                <td>{item.ws3 || 0}(0)</td>
                <td>{item.ws4 || 0}(0)</td>
                <td>{item.ws5 || 0}(0)</td>
                <td style={{fontWeight: 'bold'}}>{calculateTotal(item)}(0)</td>
                <td>{item.wa1 || 0}(0)</td>
                <td>{item.wa2 || 0}(0)</td>
                <td>{item.wdc1 || 0}(0)</td>
                <td>{item.wdc2 || 0}(0)</td>
                <td>{item.wdc3 || 0}(0)</td>
                <td>{item.wdc4 || 0}(0)</td>
                <td>{item.wdc5 || 0}(0)</td>
                <td>{item.wn1 || 0}(0)</td>
                <td>{item.wdc6 || 0}(0)</td>
                <td>{item.wdc7 || 0}</td>
                <td>{item.wrn1 || 0}</td>
                <td>{item.wrn2 || 0}</td>
                <td>{item.wpn1 || 0}</td>
                <td>{item.wpn2 || 0}</td>
                <td>{item.wna1 || 0}</td>
                <td>{item.wna2 || 0}</td>
                <td style={{fontSize: '9px'}}>
                  {new Date(item.wdates).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}