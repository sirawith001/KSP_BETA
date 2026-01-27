'use client'
import { useState, useEffect } from 'react'
import { getWorkCats, getWorkOpders, createWorkOpder, deleteWorkOpder } from './actions'
import { useRouter } from 'next/navigation'

export default function OpderAddWorkPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<any>(null)
  
  // Form values
  const [formData, setFormData] = useState({
    wopderg1: 0,
    wopderg2: 0,
    wopderg3: 0,
    wopderg4: 0,
    wopderg5: 0,
    wopderg6: ''
  })

  // 1. Init Data & User Info
  useEffect(() => {
    const initPage = async () => {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (!savedUserInfo) {
        router.replace('/login')
        return
      }
      const user = JSON.parse(savedUserInfo)
      setUserInfo(user)

      // ดึงข้อมูล Category (เวร)
      try {
        const catRes = await fetch('/api/workcat')
        const catData = await catRes.json()
        if (catData.success) setCategories(catData.data)
      } catch (err) {
        console.error('Error fetching categories', err)
      }

      setLoading(false)
    }
    
    initPage()
  }, [router])

  useEffect(() => {
    if (!userInfo?.wardid) return
    
    const fetchData = async () => {
      const records = await getWorkOpders(userInfo.wardid)
      setHistory(records)
    }
    fetchData()
  }, [userInfo])

  const handleSubmit = async () => {
    if (!userInfo?.wardid || !selectedCat) {
      alert('กรุณาเลือกเวลาเวร')
      return
    }
    
    if (!selectedDate || !selectedMonth || !selectedYear) {
      alert('กรุณาเลือก วันที่, เดือน และ ปี ให้ครบถ้วน')
      return
    }
    
    setLoading(true)
    
    const dateString = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDate.padStart(2, '0')}`
    
    const data = new FormData()
    data.append('wopderdate', dateString)
    data.append('catid', selectedCat)
    data.append('wopderg1', formData.wopderg1.toString())
    data.append('wopderg2', formData.wopderg2.toString())
    data.append('wopderg3', formData.wopderg3.toString())
    data.append('wopderg4', formData.wopderg4.toString())
    data.append('wopderg5', formData.wopderg5.toString())
    data.append('wopderg6', formData.wopderg6)
    
    await createWorkOpder(data, userInfo.wardid)
    
    const records = await getWorkOpders(userInfo.wardid)
    setHistory(records)
    
    // Reset form
    setFormData({
      wopderg1: 0,
      wopderg2: 0,
      wopderg3: 0,
      wopderg4: 0,
      wopderg5: 0,
      wopderg6: ''
    })
    
    setLoading(false)
  }

  const getCategoryLabel = (cat: any) => {
    if (!userInfo || !userInfo.department) {
       return cat.catnameopd || cat.catname
    }

    const dept = userInfo.department.trim().toUpperCase()

    if (dept === 'ER') {
      return cat.catnameer || cat.catname
    } else {
      return cat.catnameopd || cat.catname
    }
  }

  const handleDelete = async (id: number) => {
    if (!userInfo?.wardid) return
    
    if(confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      await deleteWorkOpder(id)
      const records = await getWorkOpders(userInfo.wardid)
      setHistory(records)
    }
  }

  const openEditModal = (item: any) => {
  setEditFormData({ ...item })
  setIsEditModalOpen(true)
  // เลื่อนหน้าจอไปบนสุด
  window.scrollTo({ top: 775, behavior: 'smooth' })
}

  const handleEditChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: parseInt(value) || 0
    }))
  }

  const handleSaveEdit = async () => {
    if (!editFormData) return

    try {
      const payload = {
        wopderg1: parseInt(editFormData.wopderg1) || 0,
        wopderg2: parseInt(editFormData.wopderg2) || 0,
        wopderg3: parseInt(editFormData.wopderg3) || 0,
        wopderg4: parseInt(editFormData.wopderg4) || 0,
        wopderg5: parseInt(editFormData.wopderg5) || 0,
        wopderg6: editFormData.wopderg6 || '',
        wopderid: editFormData.wopderid,
        wopderdate: editFormData.wopderdate,
        catid: editFormData.catid
      }

      const response = await fetch(`/api/workopder/${editFormData.wopderid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        alert('แก้ไขข้อมูลสำเร็จ')
        setIsEditModalOpen(false)
        setEditFormData(null)
        const records = await getWorkOpders(userInfo.wardid)
        setHistory(records)
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Error updating:', error)
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + String(error))
    }
  }

  const getDisplayWardName = () => {
    if (userInfo?.wardname && userInfo.wardname.trim() !== '') {
      return userInfo.wardname
    }
    if (userInfo?.department) {
      return userInfo.department
    }
    return userInfo?.warduser || '-'
  }

  const formatDateThai = (dateString: Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getCurrentDateThai = () => {
    return new Date().toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const filteredData = history.filter(item => {
    if (!selectedDate) return true
    if (!item.wopderdate) return false
    const itemDate = new Date(item.wopderdate)
    const targetDay = parseInt(selectedDate)
    return itemDate.getDate() === targetDay
  })

  const indexOfLastRow = currentPage * rowsPerPage
  const indexOfFirstRow = indexOfLastRow - rowsPerPage
  
  const currentRows = rowsPerPage === -1 
      ? filteredData 
      : filteredData.slice(indexOfFirstRow, indexOfLastRow)

  const totalPages = rowsPerPage === -1 
      ? 1 
      : Math.ceil(filteredData.length / rowsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  if (loading) {
    return (
      <div className="p-10 text-center font-bold">...กำลังตรวจสอบข้อมูล...</div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 font-sans bg-gradient-page text-primary opacity-0 animate-fadeIn">
      <div className="max-w-[1400px] mx-auto">
        
        {/* 🎯 Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            บันทึกภาระงาน {getDisplayWardName()}
          </h1>
          <p className="text-sm ">
            📅 วันที่: {getCurrentDateThai()}
          </p>
        </div>

        {/* 🎨 Form Section with Modern Design */}
        <div className="bg-gradient-header-a bg-gradient-to-br from-white to-green-50 p-6 rounded-2xl shadow-xl border-2 border-blue-200 mb-6">
          
          {/* 📋 Filter Section */}
          <div className="bg-filter-section backdrop-blur-sm p-5 rounded-xl mb-6 shadow-sm">
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {/* Icon */}
              <div className="flex items-center gap-2 ">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-bold text-primary">เลือกวันที่บันทึก</span>
              </div>

              {/* Date Selector */}
              <select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-gray-800 border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-lime-50"
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
                className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-gray-800 border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-lime-50"
              >
                <option value="">เดือน</option>
                {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                  <option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}-{m}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-gray-800 border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer shadow-sm hover:bg-lime-50"
              >
                <option value="">ปี พ.ศ. [ค.ศ.]</option>
                {Array.from({ length: 15 }, (_, i) => {
                  const adYear = 2026 - i
                  const beYear = adYear + 543
                  return (
                    <option key={adYear} value={adYear}>
                      {beYear}-[{adYear}]
                    </option>
                  )
                })}
              </select>

              {/* Category Selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold  whitespace-nowrap text-primary">⏰ เวลาเวร:</span>
                <select 
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="duration-500 hover:-translate-y-1 hover:shadow-lg bg-white text-gray-800 border-2 border-orange-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer shadow-sm hover:bg-orange-50 min-w-[180px]"
                >
                  <option value="">กรุณาเลือก</option>
                  {categories.map((c) => (
                    <option key={c.catid} value={c.catid}>
                      {getCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 📊 Input Table - Modern Design */}
          <div className="mb-6 overflow-hidden rounded-xl shadow-lg bg-gradient-header-b border-2 border-blue-200">
            {/* Header */}
            <div className="grid grid-cols-6 gap-0 bg-gradient-header-b bg-gradient-to-r from-green-700 to-green-900 text-white shadow-lg">
              <div className="border-r border-blue-200  p-3 text-center font-bold">🩺 รับตรวจ</div>
              <div className="border-r border-blue-200 p-3 text-center font-bold">💉 หัตถการ</div>
              <div className="border-r border-blue-200 p-3 text-center font-bold">🏥 รับป่วย</div>
              <div className="border-r border-blue-200 p-3 text-center font-bold">🚑 ส่งต่อ</div>
              <div className="border-r border-blue-200 p-3 text-center font-bold">💔 เสียชีวิต</div>
              <div className="border-r border-blue-200 p-3 text-center font-bold">📝 หมายเหตุ</div>
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-6 gap-0 bg-gradient-to-r from-green-50 to-lime-50">
              <input 
                type="number" 
                value={formData.wopderg1}
                onChange={(e) => setFormData({...formData, wopderg1: parseInt(e.target.value) || 0})}
                className="border-r-2 border-blue-200 p-4 text-center font-bold text-lg text-blue-700 focus:bg-yellow-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                min={0}
                placeholder="0"
              />
              <input 
                type="number" 
                value={formData.wopderg2}
                onChange={(e) => setFormData({...formData, wopderg2: parseInt(e.target.value) || 0})}
                className="border-r-2 border-blue-200 p-4 text-center font-bold text-lg text-green-700 focus:bg-yellow-100 focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                min={0}
                placeholder="0"
              />
              <input 
                type="number" 
                value={formData.wopderg3}
                onChange={(e) => setFormData({...formData, wopderg3: parseInt(e.target.value) || 0})}
                className="border-r-2 border-blue-200 p-4 text-center font-bold text-lg text-purple-700 focus:bg-yellow-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                min={0}
                placeholder="0"
              />
              <input 
                type="number" 
                value={formData.wopderg4}
                onChange={(e) => setFormData({...formData, wopderg4: parseInt(e.target.value) || 0})}
                className="border-r-2 border-blue-200 p-4 text-center font-bold text-lg text-orange-700 focus:bg-yellow-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                min={0}
                placeholder="0"
              />
              <input 
                type="number" 
                value={formData.wopderg5}
                onChange={(e) => setFormData({...formData, wopderg5: parseInt(e.target.value) || 0})}
                className="border-r-2 border-blue-200 p-4 text-center font-bold text-lg text-red-700 focus:bg-yellow-100 focus:ring-2 focus:ring-red-500 outline-none transition-all" 
                min={0}
                placeholder="0"
              />
              <input 
                type="text" 
                value={formData.wopderg6}
                onChange={(e) => setFormData({...formData, wopderg6: e.target.value})}
                className="p-4 px-4 text-gray-700 focus:bg-yellow-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="เพิ่มหมายเหตุ..." 
              />
            </div>
          </div>

          {/* 💾 Submit Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="duration-500 hover:-translate-y-1 bg-gradient-header bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-10 py-3 rounded-xl font-bold shadow-lg transition-all  hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <span>💾</span>
                  บันทึกข้อมูล
                </>
              )}
            </button>
          </div>
        </div>

        {/* 📊 Data Info */}
        {filteredData.length > 0 && (
          <div className="text-center mb-4">
            <div className="inline-block bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
              <span className="text-sm text-gray-600">พบข้อมูล </span>
              <span className="font-bold text-green-600 text-lg">{filteredData.length}</span>
              <span className="text-sm text-gray-600"> รายการ</span>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4 no-print">
          
          {/* 1. Rows Per Page Selector */}
          <div className="w-full md:w-auto flex justify-center items-center gap-3 text-primary backdrop-blur-lg px-4 py-2 rounded-xl shadow-sm border border-gray-200 bg-white/50">
            <span className="text-sm font-semibold whitespace-nowrap">แสดง</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => setRowsPerPage(parseInt(e.target.value))} 
              className="border-2 border-gray-300 rounded-lg px-3 py-1 bg-white font-semibold text-gray-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>ทั้งหมด</option>
            </select>
            <span className="text-sm font-semibold whitespace-nowrap">รายการ</span>
          </div>

          {/* 2. Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-2 backdrop-blur-lg px-2 py-2 rounded-xl shadow-sm border border-gray-200 bg-white/50">
              
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="px-3 py-1.5 text-primary rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                ← <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <span className="text-sm font-bold text-primary whitespace-nowrap px-2">
                หน้า {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1.5 text-primary rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                <span className="hidden sm:inline">ถัดไป</span> →
              </button>
              
            </div>
          )}
        </div>


        {/* 📋 Data Table */}
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
                <th className="border-2 border-slate-500/30 px-3 py-3 w-20 bg-gradient-to-br from-slate-600 to-slate-700">⚙️</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-8 text-center bg-gray-100 text-gray-500 font-bold">
                    ไม่พบข้อมูลสำหรับวันที่เลือก
                  </td>
                </tr>
              ) : (
                currentRows.map((item, index) => {
                  const rowColor = index % 2 === 0 ? 'bg-[#F8F8FF]' : 'bg-[#F0FFFF]'
                  return (
                    <tr key={item.wopderid} className={`${rowColor} hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration-200`}>
                      <td className="border border-black px-4 py-3 text-left font-semibold">
                        {item.category ? getCategoryLabel(item.category) : '-'}
                      </td>
                      <td className="border border-black px-3 py-3 text-center font-bold text-ws1">{item.wopderg1}</td>
                      <td className="border border-black px-3 py-3 text-center font-bold text-ws2">{item.wopderg2}</td>
                      <td className="border border-black px-3 py-3 text-center font-bold text-wa22">{item.wopderg3}</td>
                      <td className="border border-black px-3 py-3 text-center font-bold text-ws9">{item.wopderg4}</td>
                      <td className="border border-black px-3 py-3 text-center font-bold text-ws10">{item.wopderg5}</td>
                      <td className="border border-black px-4 py-3 text-left text-gray-700">{item.wopderg6 || '-'}</td>
                      <td className="border border-black px-4 py-3 text-center text-gray-600">
                        {formatDateThai(item.wopderdate)}
                      </td>
                      <td className="border border-black px-3 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white px-2 py-1 rounded-lg font-bold shadow-md transform hover:scale-110 transition-all duration-200"
                            title="แก้ไข"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(item.wopderid)} 
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-2 py-1 rounded-lg font-bold shadow-md transform hover:scale-110 transition-all duration-200"
                            title="ลบ"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              <tr><td colSpan={9} className="bg-[#CCCCCC] h-8 border-t border-black"></td></tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Bottom */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center items-center backdrop-blur-lg px-4 py-2 rounded-xl shadow-md border border-gray-200 max-w-fit mx-auto mt-4">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1} 
              className="text-primary px-4 py-2  rounded-lg font-semibold hover:from-green-600 hover:to-lime-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
            >
              &lt; ก่อนหน้า
            </button>
            <div className="flex gap-1 items-center">
              <span className="font-bold ">หน้า {currentPage} จาก {totalPages}</span>
            </div>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages} 
              className="text-primary px-4 py-2  rounded-lg font-semibold hover:from-green-600 hover:to-lime-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
            >
              ถัดไป &gt;
            </button>
          </div>
        )}

        {/* 🎨 EDIT MODAL - Modern Design */}
        {isEditModalOpen && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                    <span>✏️</span>
                    แก้ไขข้อมูล: {
                      editFormData.catid && categories.find(c => c.catid === editFormData.catid) 
                        ? getCategoryLabel(categories.find(c => c.catid === editFormData.catid))
                        : '-'
                    }
                  </h3>
                  <p className="text-gray-300 text-sm mt-1">
                    📅 วันที่ {formatDateThai(editFormData.wopderdate)}
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="text-gray-400 hover:text-white font-bold text-2xl transition-colors hover:rotate-90 transform duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="bg-white p-4 border-2 border-blue-300 rounded-xl shadow-lg">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                      <tr>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">🩺 รับตรวจ</th>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">💉 หัตถการ</th>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">🏥 รับป่วย</th>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">🚑 ส่งต่อ</th>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">💔 เสียชีวิต</th>
                        <th className="border-2 border-slate-500/30 px-3 py-3 text-center font-bold">📝 หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="number" 
                            value={editFormData.wopderg1} 
                            onChange={(e) => handleEditChange('wopderg1', e.target.value)}
                            className="w-full bg-white border-2 border-blue-400 text-center rounded-lg px-2 py-3 font-bold text-lg text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition-all shadow-sm"
                            min="0"
                          />
                        </td>
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="number" 
                            value={editFormData.wopderg2} 
                            onChange={(e) => handleEditChange('wopderg2', e.target.value)}
                            className="w-full bg-white border-2 border-green-400 text-center rounded-lg px-2 py-3 font-bold text-lg text-green-700 focus:ring-2 focus:ring-green-500 focus:border-green-600 outline-none transition-all shadow-sm"
                            min="0"
                          />
                        </td>
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="number" 
                            value={editFormData.wopderg3} 
                            onChange={(e) => handleEditChange('wopderg3', e.target.value)}
                            className="w-full bg-white border-2 border-purple-400 text-center rounded-lg px-2 py-3 font-bold text-lg text-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-600 outline-none transition-all shadow-sm"
                            min="0"
                          />
                        </td>
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="number" 
                            value={editFormData.wopderg4} 
                            onChange={(e) => handleEditChange('wopderg4', e.target.value)}
                            className="w-full bg-white border-2 border-orange-400 text-center rounded-lg px-2 py-3 font-bold text-lg text-orange-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-600 outline-none transition-all shadow-sm"
                            min="0"
                          />
                        </td>
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="number" 
                            value={editFormData.wopderg5} 
                            onChange={(e) => handleEditChange('wopderg5', e.target.value)}
                            className="w-full bg-white border-2 border-red-400 text-center rounded-lg px-2 py-3 font-bold text-lg text-red-700 focus:ring-2 focus:ring-red-500 focus:border-red-600 outline-none transition-all shadow-sm"
                            min="0"
                          />
                        </td>
                        <td className="border-2 border-blue-200 p-2">
                          <input 
                            type="text" 
                            value={editFormData.wopderg6 || ''} 
                            onChange={(e) => setEditFormData({...editFormData, wopderg6: e.target.value})}
                            className="w-full bg-white border-2 border-gray-400 rounded-lg px-3 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                            placeholder="หมายเหตุ..."
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-300 rounded-b-2xl">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-bold shadow transition-all transform hover:scale-105"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg transition-all flex items-center gap-2 transform hover:scale-105"
                >
                  <span>💾</span> บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}