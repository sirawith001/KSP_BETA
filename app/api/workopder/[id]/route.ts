import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // รับ ID จาก URL params
    let id = params?.id

    console.log('📨 Received ID:', id)

    const body = await request.json()
    console.log('📥 Body received:', body)

    // ถ้า URL ไม่มี ID ให้ดึงจาก body
    if (!id || id === 'undefined') {
      id = body.wopderid?.toString()
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ ID' },
        { status: 400 }
      )
    }

    const recordId = parseInt(id)

    // Extract update data
    const {
      wopderg1,
      wopderg2,
      wopderg3,
      wopderg4,
      wopderg5,
      wopderg6,
      wopderdate,
      catid,
      wardid
    } = body

    // Prepare update data
    const updateData: any = {
      wopderg1: Number(wopderg1) || 0,
      wopderg2: Number(wopderg2) || 0,
      wopderg3: Number(wopderg3) || 0,
      wopderg4: Number(wopderg4) || 0,
      wopderg5: Number(wopderg5) || 0,
      wopderg6: wopderg6 || null,
    }

    // อัปเดต wopderdate ถ้ามี
    if (wopderdate) {
      updateData.wopderdate = new Date(wopderdate)
    }

    // อัปเดต catid ถ้ามี
    if (catid) {
      updateData.catid = Number(catid)
    }

    console.log('📤 Updating with data:', updateData)

    // Update in database
    const updated = await prisma.workOpder.update({
      where: { wopderid: recordId },
      data: updateData,
      include: {
        category: true,
        ward: true
      }
    })

    console.log('✅ Update successful:', updated)

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ',
      data: updated
    })

  } catch (error: any) {
    console.error('❌ Error:', error)

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบันทึกนี้' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด: ' + error.message },
      { status: 500 }
    )
  }
}