import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Helper Functions & Constants ---

const safeParseInt = (value: any) => {
  if (value === null || value === undefined) return 0;
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

// ❌ เอา 'catid' และ 'wardid' ออกจาก list นี้แล้ว
const numericFields = [
  'ws1', 'ws2', 'ws3', 'ws4', 'ws5', 'ws6', 'ws7', 'ws8', 'ws9', 'ws10',
  'wa1', 'wa2', 'wa11', 'wa22',
  'wdc1', 'wdc2', 'wdc3', 'wdc4', 'wdc5', 'wdc6', 'wdc7', 
  'wdc11', 'wdc22', 'wdc33', 'wdc44', 'wdc55', 'wdc66', 'wdc77',
  'wn1', 
  'wrn1', 'wrn2', 'wpn1', 'wpn2', 'wna1', 'wna2'
];

type Props = {
  params: Promise<{ id: string }>
}

// ============================================
// GET (Single ID): ดึงข้อมูลรายรายการ
// ============================================
export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params;
    const wid = safeParseInt(params.id);

    if (wid === 0) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const workAdd = await prisma.workAdd.findUnique({
      where: { wid },
      include: {
        ward: { select: { wardid: true, wardname: true } },
        category: { select: { catid: true, catname: true } },
      },
    });

    if (!workAdd) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: workAdd });
  } catch (error) {
    console.error('❌ GET [id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// ============================================
// PUT: แก้ไขข้อมูล
// ============================================
export async function PUT(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params;
    const wid = safeParseInt(params.id);

    if (wid === 0) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();

    const existingWorkAdd = await prisma.workAdd.findUnique({
      where: { wid },
    });

    if (!existingWorkAdd) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลที่ต้องการแก้ไข' }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Loop เก็บค่าตัวเลข
    numericFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = safeParseInt(body[field]);
      }
    });

    // ❌ ตัดส่วน ward_note ทิ้งไปแล้ว เพราะไม่ได้ใช้

    // 2. จัดการวันที่
    if (body.wdates !== undefined) {
      const dateObj = new Date(body.wdates);
      updateData.wdates = dateObj;

      const thMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = thMonths[dateObj.getMonth()];
      const year = dateObj.getFullYear() + 543;
      
      updateData.wdateth = `${day} เดือน ${month} พ.ศ. ${year}`;
    }

    // 3. จัดการ Foreign Key (catid, wardid)
    if (body.catid) {
      updateData.category = {
        connect: { catid: safeParseInt(body.catid) }
      };
    }

    if (body.wardid) {
      updateData.ward = {
        connect: { wardid: safeParseInt(body.wardid) }
      };
    }

    // 4. ทำการ Update
    const updatedWorkAdd = await prisma.workAdd.update({
      where: { wid },
      data: updateData,
      include: { ward: true, category: true },
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkAdd,
      message: 'แก้ไขข้อมูลสำเร็จ',
    });

  } catch (error: any) {
    console.error('❌ PUT Error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถแก้ไขได้: มีข้อมูลซ้ำ' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update data: ' + error.message },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: ลบข้อมูล
// ============================================
export async function DELETE(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params;
    const wid = safeParseInt(params.id);

    if (wid === 0) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.workAdd.delete({
      where: { wid },
    });

    return NextResponse.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('❌ DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}