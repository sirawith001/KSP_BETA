// ============================================
// 📡 API: /app/api/workcat/[id]/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET: ดึงข้อมูลเฉพาะ ID
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catid = parseInt(params.id);

    if (isNaN(catid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const workCat = await prisma.workCat.findUnique({
      where: { catid },
      include: {
        _count: {
          select: {
            workAdds: true,
          },
        },
      },
    });

    if (!workCat) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    // จัดรูปแบบข้อมูล
    const result = {
      catid: workCat.catid,
      catname: workCat.catname,
      catnameopd: workCat.catnameopd,
      catnameer: workCat.catnameer,
      usageCount: workCat._count.workAdds,
      createdAt: workCat.createdAt,
      updatedAt: workCat.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ GET /api/workcat/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: แก้ไข WorkCat
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catid = parseInt(params.id);

    if (isNaN(catid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const existingCat = await prisma.workCat.findUnique({
      where: { catid },
    });

    if (!existingCat) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    // ถ้าเปลี่ยนชื่อ ต้องตรวจสอบว่าชื่อใหม่ซ้ำหรือไม่
    if (body.catname && body.catname !== existingCat.catname) {
      const duplicateCat = await prisma.workCat.findUnique({
        where: { catname: body.catname },
      });

      if (duplicateCat) {
        return NextResponse.json(
          { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
          { status: 409 }
        );
      }
    }

    // Validate catname
    if (body.catname !== undefined) {
      const trimmedCatname = body.catname.trim();
      if (!trimmedCatname) {
        return NextResponse.json(
          { success: false, error: 'ชื่อหมวดหมู่ไม่สามารถเว้นว่างได้' },
          { status: 400 }
        );
      }
    }

    // เตรียมข้อมูลสำหรับ update
    const updateData: any = {};

    if (body.catname !== undefined) {
      updateData.catname = body.catname.trim();
    }
    if (body.catnameopd !== undefined) {
      updateData.catnameopd = body.catnameopd ? body.catnameopd.trim() : null;
    }
    if (body.catnameer !== undefined) {
      updateData.catnameer = body.catnameer ? body.catnameer.trim() : null;
    }

    // อัพเดทข้อมูล
    const updatedWorkCat = await prisma.workCat.update({
      where: { catid },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkCat,
      message: 'แก้ไขหมวดหมู่สำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ PUT /api/workcat/[id] error:', error);

    // ตรวจสอบ Unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH: แก้ไขบางฟิลด์ (Partial Update)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catid = parseInt(params.id);

    if (isNaN(catid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const existingCat = await prisma.workCat.findUnique({
      where: { catid },
    });

    if (!existingCat) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    // Trim strings
    const updateData: any = {};
    if (body.catname !== undefined && body.catname) {
      updateData.catname = body.catname.trim();
    }
    if (body.catnameopd !== undefined) {
      updateData.catnameopd = body.catnameopd ? body.catnameopd.trim() : null;
    }
    if (body.catnameer !== undefined) {
      updateData.catnameer = body.catnameer ? body.catnameer.trim() : null;
    }

    // PATCH จะอัพเดทเฉพาะฟิลด์ที่ส่งมา
    const updatedWorkCat = await prisma.workCat.update({
      where: { catid },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkCat,
      message: 'อัพเดทหมวดหมู่สำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ PATCH /api/workcat/[id] error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to patch category' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: ลบ WorkCat
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catid = parseInt(params.id);

    if (isNaN(catid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const existingCat = await prisma.workCat.findUnique({
      where: { catid },
      include: {
        _count: {
          select: {
            workAdds: true,
          },
        },
      },
    });

    if (!existingCat) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีการใช้งานในตาราง WorkAdd หรือไม่
    const usageCount = existingCat._count.workAdds;

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้ เนื่องจากมีการใช้งานอยู่ ${usageCount} รายการ`,
          usageCount,
        },
        { status: 400 }
      );
    }

    // ลบข้อมูล
    await prisma.workCat.delete({
      where: { catid },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จ',
      deletedCat: {
        catid: existingCat.catid,
        catname: existingCat.catname,
      },
    });
  } catch (error: any) {
    console.error('❌ DELETE /api/workcat/[id] error:', error);

    // ตรวจสอบ Foreign Key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบได้ เนื่องจากมีการใช้งานในระบบ',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}