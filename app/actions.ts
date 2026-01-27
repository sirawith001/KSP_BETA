'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// ดึงข้อมูลหมวดงาน (เวลาเวร) สำหรับ Dropdown
export async function getWorkCats() {
  // อาจจะกรองเฉพาะที่เป็น OPD ถ้าจำเป็น
  return await prisma.workCat.findMany({
    orderBy: { catid: 'asc' }
  })
}

// ดึงข้อมูลประวัติการบันทึก (ตารางด้านล่าง)
export async function getWorkOpders(wardId: number) {
  return await prisma.workOpder.findMany({
    where: { wardid: wardId },
    include: {
      category: true, // Join เอาชื่อเวรมาแสดง
    },
    orderBy: {
      wopderdate: 'desc'
    }
  })
}

// บันทึกข้อมูลใหม่
export async function createWorkOpder(formData: FormData, wardId: number) {
  const rawDate = formData.get('wopderdate') as string
  const catid = formData.get('catid')
  
  // แปลงค่าจาก Input เป็น Int (ถ้าว่างให้เป็น 0)
  const g1 = parseInt(formData.get('wopderg1') as string) || 0 // รับตรวจ
  const g2 = parseInt(formData.get('wopderg2') as string) || 0 // หัตถการ
  const g3 = parseInt(formData.get('wopderg3') as string) || 0 // รับป่วย
  const g4 = parseInt(formData.get('wopderg4') as string) || 0 // ส่งต่อ
  const g5 = parseInt(formData.get('wopderg5') as string) || 0 // เสียชีวิต
  const g6 = formData.get('wopderg6') as string // หมายเหตุ

  await prisma.workOpder.create({
    data: {
      wardid: wardId,
      catid: catid ? parseInt(catid as string) : null,
      wopderdate: new Date(rawDate),
      wopderg1: g1,
      wopderg2: g2,
      wopderg3: g3,
      wopderg4: g4,
      wopderg5: g5,
      wopderg6: g6,
    }
  })

  // รีเฟรชหน้าจอเพื่อแสดงข้อมูลใหม่
  revalidatePath('/opd_er/opderaddwork')
}

// ลบข้อมูล
export async function deleteWorkOpder(id: number) {
    await prisma.workOpder.delete({
        where: { wopderid: id }
    })
    revalidatePath('/opd_er/opderaddwork')
}