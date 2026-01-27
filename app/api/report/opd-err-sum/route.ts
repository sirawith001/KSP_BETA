// app/api/report/opd-err-sum/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const wardid = searchParams.get('wardid')

    if (!dateStr || !wardid) {
      return NextResponse.json({ success: false, error: 'ระบุข้อมูลไม่ครบ' }, { status: 400 })
    }

    const recordWardId = parseInt(wardid)

    // -----------------------------------------------------------
    // 🕵️ X-RAY: แอบดูข้อมูลล่าสุด
    // -----------------------------------------------------------
    const checkLatest = await prisma.workOpder.findMany({
      where: { wardid: recordWardId },
      orderBy: { wopderdate: 'desc' },
      take: 3,
      select: { wopderid: true, wopderdate: true }
    })
    
    console.log('------------------------------------------------')
    console.log('🕵️ X-RAY DB DATA (ข้อมูลจริงในฐานข้อมูล):')
    checkLatest.forEach(r => {
        // แปลงเป็นเวลาไทยให้ดูง่ายๆ ใน Log
        const thaiTime = new Date(r.wopderdate).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        console.log(`🆔 ID: ${r.wopderid} | 🇹🇭 Thai Time: ${thaiTime} | 🌍 UTC: ${r.wopderdate.toISOString()}`)
    })
    console.log('------------------------------------------------')


    // ฟังก์ชันค้นหา (ปรับปรุงให้ตรงกับเวลาไทย 00:00 - 23:59)
    const fetchRecords = async (targetDate: Date) => {
      // 1. ตั้งต้นเป็นเวลา 00:00 - 23:59 ของวันที่เลือก
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      // 2. แปลงช่วงเวลานั้นให้เป็น UTC โดยการลบ 7 ชั่วโมง (Shift Timezone)
      // เพื่อให้ query ไปตรงกับเวลาที่ Prisma เก็บใน DB (ซึ่งเป็น UTC)
      // ตัวอย่าง: หาข้อมูลวันที่ 15 (ไทย) -> ต้องหาตั้งแต่ 14 (17:00 UTC) ถึง 15 (16:59 UTC)
      const startUTC = new Date(startOfDay.getTime() - (7 * 60 * 60 * 1000));
      const endUTC = new Date(endOfDay.getTime() - (7 * 60 * 60 * 1000));

      console.log(`🔎 Searching (Thai Time Range -> UTC): ${startUTC.toISOString()} -> ${endUTC.toISOString()}`);

      return await prisma.workOpder.findMany({
        where: {
          wardid: recordWardId,
          wopderdate: {
            gte: startUTC,
            lte: endUTC
          }
        },
        include: { category: true, ward: true },
        orderBy: { catid: 'asc' }
      })
    }

    // --- เริ่มค้นหา ---
    let targetDate = new Date(dateStr)
    let inputYear = targetDate.getFullYear()
    let records: any[] = []

    // Logic แปลงปี (เหมือนเดิม)
    if (inputYear > 2400) {
      console.log(`⚠️ Input ปี ${inputYear} (พ.ศ.) -> ใช้ปี ${inputYear - 543} ค้นหา`)
      targetDate.setFullYear(inputYear - 543)
      records = await fetchRecords(targetDate)
    } else {
      console.log(`✅ Input ปี ${inputYear} (ค.ศ.) -> ค้นหาปกติ`)
      records = await fetchRecords(targetDate)
      
      if (records.length === 0) {
         console.log('⚠️ ไม่เจอแบบ ค.ศ. -> ลองหาแบบ พ.ศ. เผื่อฟลุ๊ค')
         const beDate = new Date(targetDate)
         beDate.setFullYear(beDate.getFullYear() + 543)
         const beRecords = await fetchRecords(beDate)
         if (beRecords.length > 0) records = beRecords
      }
    }

    console.log(`✅ Final Result: เจอทั้งหมด ${records.length} รายการ`)

    const reportData = records.map((record) => ({
      wopderid: record.wopderid,
      category: record.category,
      wopderg1: record.wopderg1,
      wopderg2: record.wopderg2,
      wopderg3: record.wopderg3,
      wopderg4: record.wopderg4,
      wopderg5: record.wopderg5,
      wopderg6: record.wopderg6,
      wopderdate: record.wopderdate,
    }))

    return NextResponse.json({
      success: true,
      data: reportData,
      message: `พบข้อมูล ${reportData.length} รายการ`
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}