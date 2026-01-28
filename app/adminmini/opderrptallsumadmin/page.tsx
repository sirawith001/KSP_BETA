'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminOpdErrReportPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any[]>([])
  
  const [wardList, setWardList] = useState<any[]>([]) 
  const [selectedWardId, setSelectedWardId] = useState('')

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    const initPage = async () => {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (!savedUserInfo) {
        router.replace('/login')
        return
      }
      const user = JSON.parse(savedUserInfo)
      setUserInfo(user)

      try {
        const res = await fetch('/api/ward') 
        const data = await res.json()
        if (data.success) {
          setWardList(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch ward list', err)
      }

      setLoading(false)
    }
    initPage()
  }, [router])

  const getSelectedWardName = () => {
    if (!selectedWardId || wardList.length === 0) return 'ไม่ระบุหน่วยงาน'
    const selectedId = parseInt(selectedWardId)
    const ward = wardList.find(w => w.wardid === selectedId)
    return ward ? (ward.wardname || ward.warduser || 'ไม่ระบุชื่อ') : 'ไม่พบหน่วยงาน'
  }

  const getCategoryName = (item: any) => {
    const selectedWard = wardList.find(w => w.wardid === parseInt(selectedWardId))
    const isER = selectedWard?.department === 'ER' || selectedWard?.wardname?.includes('ER')
    
    if (isER && item.category?.catnameer) {
      return item.category.catnameer
    }
    
    return item.categoryName || item.category?.catnameopd || item.category?.catname || '-'
  }

  const handleSearch = async () => {
    if (!selectedWardId) {
      alert('กรุณาเลือก หน่วยงาน/หอผู้ป่วย')
      return
    }
    if (!selectedDate || !selectedMonth || !selectedYear) {
      alert('กรุณาเลือก วันที่, เดือน และ ปี ให้ครบถ้วน')
      return
    }

    setLoading(true)
    try {
      const dateString = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDate.padStart(2, '0')}`
      
      const response = await fetch(`/api/report/opd-err-sum?date=${dateString}&wardid=${selectedWardId}`)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data || [])
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล')
    }
    setLoading(false)
  }

  const getCurrentDateThai = () => {
    return new Date().toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatDateThai = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

  const calculateTotal = (field: string) => {
    return reportData.reduce((sum, item) => sum + (item[field] || 0), 0)
  }

  const total1 = calculateTotal('wopderg1')
  const total2 = calculateTotal('wopderg2')
  const total3 = calculateTotal('wopderg3')
  const total4 = calculateTotal('wopderg4')
  const total5 = calculateTotal('wopderg5')
  
  const exportToExcel = async () => {
    if (reportData.length === 0) {
      alert('ไม่มีข้อมูลที่จะส่งออก')
      return
    }

    if (wardList.length === 0) {
      alert('กรุณารอสักครู่ ระบบกำลังโหลดข้อมูลหน่วยงาน')
      return
    }

    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('สรุปยอดภาระงาน')

      const buddYear = parseInt(selectedYear) + 543
      const monthName = monthNames[parseInt(selectedMonth) - 1]
      const wardNameDisplay = getSelectedWardName()

      worksheet.mergeCells('A1:H1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = `สรุปยอดภาระงาน [ ${wardNameDisplay} ]`
      titleCell.font = { bold: true, size: 16, name: 'Angsana New' }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(1).height = 25

      worksheet.mergeCells('A2:H2')
      const subtitleCell = worksheet.getCell('A2')
      subtitleCell.value = `วันที่ ${selectedDate} เดือน ${monthName} พ.ศ. ${buddYear}`
      subtitleCell.font = { bold: true, size: 12, name: 'Angsana New' }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(2).height = 20

      worksheet.addRow([])

      const headers = ['บริการ', 'รับตรวจ', 'หัตถการ', 'รับป่วย', 'ส่งต่อ', 'เสียชีวิต', 'หมายเหตุ', 'วันที่']
      const headerRow = worksheet.addRow(headers)
      
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Angsana New', size: 11 }
      
      headerRow.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        }
      })
      worksheet.getRow(4).height = 25

      reportData.forEach((item: any, idx: number) => {
        const row = worksheet.addRow([
          getCategoryName(item),
          item.wopderg1 || 0,
          item.wopderg2 || 0,
          item.wopderg3 || 0,
          item.wopderg4 || 0,
          item.wopderg5 || 0,
          item.wopderg6 || '',
          item.wopderdate ? formatDateThai(item.wopderdate) : '-'
        ])

        const bgColor = idx % 2 === 0 ? 'FFE7E6E6' : 'FFFFFFFF'
        row.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.font = { name: 'Angsana New', size: 16 }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
        })

        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
        row.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' }
      })

      const summaryRow = worksheet.addRow([
        'รวมทั้งสิ้น',
        total1,
        total2,
        total3,
        total4,
        total5,
        '',
        ''
      ])
      
      summaryRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Angsana New', size: 16 }
      
      summaryRow.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9900' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        }
      })
      worksheet.getRow(reportData.length + 5).height = 25

      worksheet.columns = [
        { width: 28 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 22 },
        { width: 16 }
      ]

      const filename = `สรุปยอดภาระงานประจำวัน_${selectedDate}_${monthName}_${buddYear}_${wardNameDisplay}.xlsx`
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('เกิดข้อผิดพลาดในการส่งออก Excel')
    }
  }

  const printReport = () => {
    if (reportData.length === 0) {
      alert('ไม่มีข้อมูลที่จะพิมพ์')
      return
    }

    const printWindow = window.open('', '_blank')

    if (printWindow) {
        const monthName = monthNames[parseInt(selectedMonth) - 1]
        const buddYear = parseInt(selectedYear) + 543
        const wardNameDisplay = getSelectedWardName()

        const formattedData = reportData.map(item => ({
          ...item,
          formattedDate: item.wopderdate ? formatDateThai(item.wopderdate) : '-',
          displayName: getCategoryName(item)
        }))

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>สรุปยอดภาระงานประจำวัน</title>
            <style>
              @media print {
                @page { 
                  size: A4 landscape; 
                  margin: 10mm; 
                }
                body { 
                  margin: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              
              * {
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Sarabun', 'Angsana New', Arial, sans-serif; 
                padding: 15px;
                background-color: white;
                font-size: 20px;
              }
              
              .header { 
                text-align: center; 
                margin-bottom: 25px;
                border-bottom: 3px solid #333;
                padding-bottom: 15px;
              }
              
              h1 { 
                font-size: 28px; 
                font-weight: bold; 
                margin: 0 0 8px 0; 
                color: #000;
                letter-spacing: 0.5px;
              }
              
              .date-info {
                font-size: 18px;
                color: #333;
                font-weight: 600;
                margin-top: 8px;
              }
              
              table { 
                width: 100%; 
                border-collapse: collapse; 
                background-color: white;
                border: 2px solid #000;
                font-size: 16px;
              }
              
              thead {
                background-color: #e5e7eb;
                border-bottom: 2px solid #000;
              }
              
              th { 
                border: 1px solid #000;
                padding: 14px 8px;
                text-align: center;
                font-weight: bold;
                font-size: 17px;
                color: #000;
                background-color: #d1d5db;
              }
              
              tbody tr {
                border-bottom: 1px solid #999;
                page-break-inside: avoid;
              }
              
              tbody tr:nth-child(even) {
                background-color: #f9fafb;
              }
              
              td { 
                border: 1px solid #666;
                padding: 12px 8px;
                text-align: center;
                font-size: 16px;
                color: #000;
              }
              
              .text-left { 
                text-align: left;
                font-weight: 600;
                padding-left: 12px;
              }
              
              .font-semibold {
                font-weight: 700;
                font-size: 17px;
              }
              
              .summary-row { 
                background-color: #fef3c7 !important;
                border: 2px solid #000 !important;
                font-weight: bold;
                page-break-inside: avoid;
              }
              
              .summary-row td {
                border: 1px solid #000;
                padding: 14px 8px;
                font-weight: bold;
                font-size: 18px;
              }
              
              .col-service { width: 28%; }
              .col-number { width: 9%; }
              .col-remark { width: 18%; }
              .col-date { width: 10%; }
              
              @media screen {
                body {
                  max-width: 1400px;
                  margin: 20px auto;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  padding: 30px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>สรุปยอดภาระงานประจำวัน [ ${wardNameDisplay} ]</h1>
              <p class="date-info">วันที่ ${selectedDate} เดือน ${monthName} พ.ศ. ${buddYear}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th class="col-service">บริการ</th>
                  <th class="col-number">รับตรวจ</th>
                  <th class="col-number">หัตถการ</th>
                  <th class="col-number">รับป่วย</th>
                  <th class="col-number">ส่งต่อ</th>
                  <th class="col-number">เสียชีวิต</th>
                  <th class="col-remark">หมายเหตุ</th>
                  <th class="col-date">วันที่</th>
                </tr>
              </thead>
              <tbody>
                ${formattedData.map(item => `
                  <tr>
                    <td class="text-left">${item.displayName}</td>
                    <td class="font-semibold">${item.wopderg1 || 0}</td>
                    <td class="font-semibold">${item.wopderg2 || 0}</td>
                    <td class="font-semibold">${item.wopderg3 || 0}</td>
                    <td class="font-semibold">${item.wopderg4 || 0}</td>
                    <td class="font-semibold">${item.wopderg5 || 0}</td>
                    <td class="text-left" style="font-size: 14px; padding-left: 8px;">${item.wopderg6 || '-'}</td>
                    <td style="font-size: 15px;">${item.formattedDate}</td>
                  </tr>
                `).join('')}
                <tr class="summary-row">
                  <td class="text-left">รวมทั้งสิ้น</td>
                  <td>${total1}</td>
                  <td>${total2}</td>
                  <td>${total3}</td>
                  <td>${total4}</td>
                  <td>${total5}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </body>
          </html>
        `

        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        setTimeout(() => {
            if (printWindow) printWindow.print()
        }, 250)
    } else {
        alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้')
    }
  }

  if (loading && !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-page p-4 font-sans text-primary  opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* 🎯 Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2  bg-clip-text">
            สรุปยอดภาระงานประจำวัน
          </h1>
          <p className="text-sm ">
            📅 วันที่: {getCurrentDateThai()}
          </p>
        </div>

        {/* 🎨 Filter & Action Section */}
        <div className="bg-filter-section  flex flex-wrap justify-center items-center gap-2  px-3 py-2 rounded-xl border-1 border-blue-200 shadow-sm mx-auto w-fit mb-8">
    
            
            {/* Icon */}
            <div className="flex items-center gap-2 ">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-bold text-primary">เลือกหน่วยงาน</span>
            </div>

            {/* Ward Selector */}
            <select 
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-black border-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50 min-w-[200px]"
            >
              <option value="">-- เลือกหน่วยงาน --</option>
              {wardList.map((ward) => (
                <option key={ward.wardid} value={ward.wardid}>
                  {ward.wardname || ward.warduser} 
                </option>
              ))}
            </select>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px bg-filter-section"></div>

            {/* Calendar Icon */}
            <div className="flex items-center gap-2 ">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-bold text-primary">เลือกวันที่</span>
            </div>

            {/* Date Selector */}
            <select 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-black border-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
            >
              <option value="">วันที่</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>

            {/* Month Selector */}
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-black border-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
            >
              <option value="">เดือน</option>
              {monthNames.map((m, i) => (
                <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}-{m}</option>
              ))}
            </select>

            {/* Year Selector */}
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-black border-1 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-green-50"
            >
              <option value="">ปี พ.ศ. [ค.ศ.]</option>
              {Array.from({ length: 30 }, (_, i) => {
                const gregorianYear = 2029 - i
                const buddhYear = gregorianYear + 543
                return (
                  <option key={gregorianYear} value={gregorianYear}>
                    {buddhYear}-[{gregorianYear}]
                  </option>
                )
              })}
            </select>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="duration-500 hover:-translate-y-1 bg-gradient-header bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 hover:from-green-700 hover:to-lime-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all  hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังค้นหา...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  ค้นหา
                </>
              )}
            </button>

            {/* Export & Print Buttons */}
            {reportData.length > 0 && (
              <>
                <button 
                  onClick={exportToExcel}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-2 rounded-lg font-bold shadow-lg transition-all transform hover:scale-110"
                  title="ส่งออก Excel"
                >
                  <img src="/EXCEL.png" alt="excel" className='w-7 h-7' />
                </button>
                <button 
                  onClick={printReport}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-2 rounded-lg font-bold shadow-lg transition-all transform hover:scale-110"
                  title="พิมพ์รายงาน"
                >
                  <img src="/PRINTER.png" alt="printer" className='w-7 h-7' />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 📊 Report Title */}
        {reportData.length > 0 && selectedDate && selectedMonth && selectedYear && (
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-green-100 to-lime-100 px-6 py-3 rounded-xl border-2 border-green-600 shadow-md">
              <h2 className="text-lg font-bold text-gray-800">
                📋 สรุปยอดภาระงานประจำวันที่ {selectedDate} เดือน {monthNames[parseInt(selectedMonth) - 1]} พ.ศ. {parseInt(selectedYear) + 543}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                พบข้อมูล <span className="font-bold text-blue-600">{reportData.length}</span> รายการ
              </p>
            </div>
          </div>
        )}

        {/* 📋 Report Table */}
        <div className="overflow-x-auto border-t-2 border-black min-h-[300px]">
          <table className="w-full text-sm text-black border-collapse border-2 border-black shadow-lg">
            <thead className="text-center font-bold bg-gradient-to-r from-slate-700 to-slate-900 text-white sticky top-0">
              <tr>
                <th className="border-2 border-slate-500/30 px-4 py-3 bg-gradient-to-br from-slate-600 to-slate-700">🕐 บริการ</th>
                <th className="border-2 border-slate-500/30 px-3 py-3 w-20 bg-gradient-to-br from-blue-600 to-blue-700">🩺 รับตรวจ</th>
                <th className="border-2 border-slate-500/30 px-3 py-3 w-20 bg-gradient-to-br from-green-600 to-green-700">💉 หัตถการ</th>
                <th className="border-2 border-slate-500/30 px-3 py-3 w-20 bg-gradient-to-br from-purple-600 to-purple-700">🏥 รับป่วย</th>
                <th className="border-2 border-slate-500/30 px-3 py-3 w-20 bg-gradient-to-br from-orange-600 to-orange-700">🚑 ส่งต่อ</th>
                <th className="border-2 border-slate-500/30 px-3 py-3 w-24 bg-gradient-to-br from-red-600 to-red-700">💔 เสียชีวิต</th>
                <th className="border-2 border-slate-500/30 px-4 py-3 bg-gradient-to-br from-slate-600 to-slate-700">📝 หมายเหตุ</th>
                <th className="border-2 border-slate-500/30 px-4 py-3 w-28 bg-gradient-to-br from-slate-600 to-slate-700">📅 วันที่</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-black p-8 text-center bg-gray-100 text-gray-500 font-bold">
                    {selectedWardId ? 'ไม่พบข้อมูล' : 'กรุณาเลือกหน่วยงานและวันที่ แล้วกดค้นหา'}
                  </td>
                </tr>
              ) : (
                <>
                  {reportData.map((item, idx) => {
                    const rowColor = idx % 2 === 0 ? 'bg-[#F8F8FF]' : 'bg-[#F0FFFF]'
                    return (
                      <tr key={idx} className={`${rowColor} hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration-200`}>
                        <td className="border border-black px-4 py-3 text-left font-semibold">
                          {getCategoryName(item)}
                        </td>
                        <td className="border border-black px-3 py-3 text-center font-bold text-ws1">{item.wopderg1 || 0}</td>
                        <td className="border border-black px-3 py-3 text-center font-bold text-ws2">{item.wopderg2 || 0}</td>
                        <td className="border border-black px-3 py-3 text-center font-bold text-wa22">{item.wopderg3 || 0}</td>
                        <td className="border border-black px-3 py-3 text-center font-bold text-ws9">{item.wopderg4 || 0}</td>
                        <td className="border border-black px-3 py-3 text-center font-bold text-ws10">{item.wopderg5 || 0}</td>
                        <td className="border border-black px-4 py-3 text-left text-gray-700 text-xs">{item.wopderg6 || '-'}</td>
                        <td className="border border-black px-4 py-3 text-center text-gray-600 text-sm">
                          {item.wopderdate ? formatDateThai(item.wopderdate) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Summary Row */}
                  <tr className="bg-gradient-to-r from-yellow-200 to-orange-200 border-2 border-black font-bold">
                    <td className="border-2 border-black px-4 py-4 text-left text-lg">🎯 รวมทั้งสิ้น</td>
                    <td className="border-2 border-black px-3 py-4 text-center text-ws1 text-lg">{total1}</td>
                    <td className="border-2 border-black px-3 py-4 text-center text-ws2 text-lg">{total2}</td>
                    <td className="border-2 border-black px-3 py-4 text-center text-wa22 text-lg">{total3}</td>
                    <td className="border-2 border-black px-3 py-4 text-center text-ws9 text-lg">{total4}</td>
                    <td className="border-2 border-black px-3 py-4 text-center text-ws10 text-lg">{total5}</td>
                    <td className="border-2 border-black px-4 py-4"></td>
                    <td className="border-2 border-black px-4 py-4 text-center"></td>
                  </tr>
                </>
              )}
              <tr><td colSpan={8} className="bg-[#CCCCCC] h-8 border-t border-black"></td></tr>
            </tbody>
          </table>
        </div>

      </div>

  )
}