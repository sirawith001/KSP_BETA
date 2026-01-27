export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const safeParseInt = (value: any) => {
  if (value === null || value === undefined) return 0;
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardid = searchParams.get('wardid');
    const catid = searchParams.get('catid'); 
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log(`🔍 API Params: date=${date}, month=${month}, year=${year}, catid=${catid}`);

    const where: any = {};

    if (wardid) where.wardid = safeParseInt(wardid);
    if (catid) where.catid = safeParseInt(catid);

    // ⭐ แก้ไขส่วนนี้ - ใช้ local time แทน UTC
    if (date && month && year && date !== 'undefined' && date !== '') {
      const y = parseInt(year);
      const m = parseInt(month) - 1;
      const d = parseInt(date);

      // ✅ ใช้ local time ตรงกับ Bangkok timezone
      const startDate = new Date(y, m, d, 0, 0, 0, 0);
      const endDate = new Date(y, m, d, 23, 59, 59, 999);

      where.wdates = { 
        gte: startDate, 
        lte: endDate 
      };

      console.log('📅 Date Range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        formatted: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      });

    } else if (month && year) {
      const y = parseInt(year);
      const m = parseInt(month) - 1;
      
      const startDate = new Date(y, m, 1, 0, 0, 0, 0);
      const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);

      where.wdates = { gte: startDate, lte: endDate };
      console.log('📅 Month Mode:', m + 1, '/', y);

    } else if (year) {
      const y = parseInt(year);
      const startDate = new Date(y, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(y, 11, 31, 23, 59, 59, 999);

      where.wdates = { gte: startDate, lte: endDate };
      console.log('📅 Year Mode:', y);
    }

    const workAdds = await prisma.workAdd.findMany({
      where,
      include: {
        ward: { 
          select: { 
            wardid: true, 
            wardname: true, 
            warduser: true, 
            warddest: true 
          } 
        },
        category: { 
          select: { 
            catid: true, 
            catname: true 
          } 
        },
      },
      orderBy: [ 
        { wdates: 'desc' }, 
        { wardid: 'asc' } 
      ],
    });

    console.log(`✅ Found ${workAdds.length} records`);

    return NextResponse.json({ 
      success: true, 
      data: workAdds, 
      count: workAdds.length,
      query: where // สำหรับ debug
    });

  } catch (error) {
    console.error('❌ GET /api/workadds error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' }, 
      { status: 500 }
    );
  }
}

// ============================================
// POST: บันทึกข้อมูล (Code เดิมของคุณที่ถูกต้องแล้ว)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.wardid || !body.catid || !body.wdates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const data: any = {};
    
    // แปลงค่าตัวเลขทั้งหมด
    const numericFields = [
      'ws1', 'ws2', 'ws3', 'ws4', 'ws5', 'ws6', 'ws7', 'ws8', 'ws9', 'ws10',
      'wa1', 'wa2', 'wa11', 'wa22',
      'wdc1', 'wdc2', 'wdc3', 'wdc4', 'wdc5', 'wdc6', 'wdc7', 
      'wdc11', 'wdc22', 'wdc33', 'wdc44', 'wdc55', 'wdc66', 'wdc77',
      'wn1', 
      'wrn1', 'wrn2', 'wpn1', 'wpn2', 'wna1', 'wna2' 
    ];
    
    numericFields.forEach(field => {
      data[field] = safeParseInt(body[field]);
    });
    
    data.wardid = safeParseInt(body.wardid);
    data.catid = safeParseInt(body.catid);
    
    // บันทึกวันที่ (ใช้วันที่ที่ส่งมาจาก Frontend)
    data.wdates = new Date(body.wdates);

    // สร้าง String วันที่ภาษาไทย
    const thMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const dateObj = new Date(body.wdates);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = thMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear() + 543;

    data.wdateth = `${day} เดือน ${month} พ.ศ. ${year}`;

    const newWorkAdd = await prisma.workAdd.create({
      data: data,
      include: {
        ward: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newWorkAdd,
      message: 'บันทึกข้อมูลสำเร็จ',
    });

  } catch (error: any) {
    console.error('❌ POST /api/workadd error:', error);
    
    // จัดการ Error กรณีข้อมูลซ้ำ (Unique Constraint)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'มีข้อมูลสำหรับหอผู้ป่วยนี้ ในวันและเวลานี้ถูกบันทึกไว้แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create data' },
      { status: 500 }
    );
  }
}