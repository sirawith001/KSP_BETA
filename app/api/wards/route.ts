import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const wards = await prisma.wardUser.findMany({
      // ส่วนที่เพิ่มเข้ามาเพื่อกรองข้อมูล
      where: {
        wardname: {
          notIn: ['OPD', 'ER','admin','ฝ่ายการพยาบาล'] // จะไม่ดึงข้อมูลที่มี wardname เป็น 'OPD' หรือ 'ER'
        }
      },
      // จบส่วนที่เพิ่ม
      select: {
        wardid: true,
        wardname: true,
        warduser: true,
      },
      orderBy: {
        wardname: 'asc',
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: wards 
    });
  } catch (error) {
    console.error('Error fetching wards:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch wards' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}