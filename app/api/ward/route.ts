import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const wards = await prisma.wardUser.findMany({
      // ✅ เพิ่มเงื่อนไข where ตรงนี้
      where: {
        department: {
          in: ['OPD', 'ER'] // ดึงเฉพาะ department ที่เป็น OPD หรือ ER
        }
      },
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