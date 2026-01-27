import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const where: any = {};

    if (wardid) where.wardid = safeParseInt(wardid);
    if (catid) where.catid = safeParseInt(catid);

    if (date && month && year) {
      const startDate = new Date(`${year}-${month}-${date}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.wdates = { gte: startDate, lt: endDate };
    } else if (month && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.wdates = { gte: startDate, lt: endDate };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${safeParseInt(year) + 1}-01-01`);
      where.wdates = { gte: startDate, lt: endDate };
    }

    const workAdds = await prisma.workAdd.findMany({
      where,
      include: {
        ward: { select: { wardid: true, wardname: true, warduser: true, warddest: true } },
        category: { select: { catid: true, catname: true } },
      },
      orderBy: [ { wdates: 'desc' }, { catid: 'asc' } ],
    });

    return NextResponse.json({ success: true, data: workAdds, count: workAdds.length });
  } catch (error) {
    console.error('❌ GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

// ============================================
// POST: สร้างข้อมูลใหม่ (แก้ไขส่วนวันที่ไทยที่นี่)
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
    
    // วันที่ (System Date)
    data.wdates = new Date(body.wdates);

    // -------------------------------------------------------------
    // ⭐ แก้ไข: สร้าง string วันที่ภาษาไทยอัตโนมัติ
    // รูปแบบ: "08 เดือน มกราคม พ.ศ. 2568"
    // -------------------------------------------------------------
    const thMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const dateObj = new Date(body.wdates);
    
    // วันที่: แปลงเป็น string แล้วเติม 0 ข้างหน้าถ้ามีหลักเดียว (เช่น 8 -> 08)
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    // เดือน: ดึงชื่อจาก Array
    const month = thMonths[dateObj.getMonth()];
    
    // ปี: ค.ศ. + 543
    const year = dateObj.getFullYear() + 543;

    // รวมเป็น String
    data.wdateth = `${day} เดือน ${month} พ.ศ. ${year}`;
    // -------------------------------------------------------------

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