'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// 1. ดึงข้อมูลเวร (Category)
export async function getWorkCats() {
  return await prisma.workCat.findMany({
    orderBy: { catid: 'asc' }
  })
}

// 2. ดึงข้อมูลประวัติการบันทึก OPD (WorkOpder)
// 2. ดึงข้อมูลประวัติการบันทึก OPD (WorkOpder)
export async function getWorkOpders(wardId: number) {
  const opdData = await prisma.workOpder.findMany({
    where: { 
      wardid: wardId,
      // 👇 เพิ่มบรรทัดนี้ครับ: ถ้า catid เป็น null ไม่ต้องดึงมา
      catid: { not: null } 
    },
    select: {
      wopderid: true,
      wardid: true,
      wopderdate: true,
      wopderg1: true,
      wopderg2: true,
      wopderg3: true,
      wopderg4: true,
      wopderg5: true,
      wopderg6: true,
      catid: true,
      category: true, 
      // ❌ ห้ามใส่ updatedAt
    },
    orderBy: {
      wopderdate: 'desc' 
    },
    take: 100 
  })
  return opdData;
}

// 3. บันทึกข้อมูลใหม่
export async function createWorkOpder(formData: FormData, wardId: number) {
  const rawDate = formData.get('wopderdate') as string
  const catid = formData.get('catid')

  // แปลงค่า Input เป็น Int (ถ้าว่างให้เป็น 0)
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

  revalidatePath('/opd_er/opderaddwork') // รีเฟรชหน้า
}

// 4. ลบข้อมูล
export async function deleteWorkOpder(id: number) {
  await prisma.workOpder.delete({
    where: { wopderid: id }
  })
  revalidatePath('/opd_er/opderaddwork')
}