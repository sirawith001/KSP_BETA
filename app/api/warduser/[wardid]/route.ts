import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET: ดึงข้อมูล WardUser เฉพาะ ID
// ============================================
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ wardid: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const params = await props.params;
    const wardid = parseInt(params.wardid);

    console.log('🔍 Received wardid:', wardid);

    if (isNaN(wardid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const wardUser = await prisma.wardUser.findUnique({
      where: { wardid },
      select: {
        wardid: true,
        warduser: true,
        role: true,
        wardname: true,
        wardstatus: true,
        warddest: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!wardUser) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    console.log('✅ Found ward user:', wardUser.wardname);

    return NextResponse.json({
      success: true,
      data: wardUser,
    });
  } catch (error) {
    console.error('❌ GET /api/warduser/[wardid] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ward user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// PUT: แก้ไขข้อมูล WardUser
// ============================================
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ wardid: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const params = await props.params;
    const wardid = parseInt(params.wardid);

    if (isNaN(wardid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const existingUser = await prisma.wardUser.findUnique({
      where: { wardid },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // เตรียมข้อมูลสำหรับ update
    const updateData: any = {};

    if (body.warduser !== undefined) {
      // ตรวจสอบว่า username ซ้ำหรือไม่
      if (body.warduser !== existingUser.warduser) {
        const duplicateUser = await prisma.wardUser.findUnique({
          where: { warduser: body.warduser },
        });

        if (duplicateUser) {
          return NextResponse.json(
            { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
            { status: 409 }
          );
        }
      }
      updateData.warduser = body.warduser;
    }

    if (body.wardname !== undefined) {
      updateData.wardname = body.wardname || null;
    }

    if (body.wardstatus !== undefined) {
      updateData.wardstatus = body.wardstatus || null;
    }

    if (body.warddest !== undefined) {
      updateData.warddest = body.warddest || null;
    }

    if (body.role !== undefined) {
      updateData.role = body.role;
    }

    // ถ้าต้องการเปลี่ยนรหัสผ่าน (ควร hash ด้วย bcrypt)
    if (body.wardpass !== undefined && body.wardpass) {
      updateData.wardpass = body.wardpass;
    }

    // อัพเดทข้อมูล
    const updatedUser = await prisma.wardUser.update({
      where: { wardid },
      data: updateData,
      select: {
        wardid: true,
        warduser: true,
        role: true,
        wardname: true,
        wardstatus: true,
        warddest: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'แก้ไขข้อมูลสำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ PUT /api/warduser/[wardid] error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update ward user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// DELETE: ลบ WardUser
// ============================================
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ wardid: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const params = await props.params;
    const wardid = parseInt(params.wardid);

    if (isNaN(wardid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
    const existingUser = await prisma.wardUser.findUnique({
      where: { wardid },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลที่เกี่ยวข้องหรือไม่
    const workAddCount = await prisma.workAdd.count({
      where: { wardid },
    });

    if (workAddCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้ เนื่องจากมีข้อมูลการบันทึก ${workAddCount} รายการ`,
        },
        { status: 400 }
      );
    }

    // ลบข้อมูล
    await prisma.wardUser.delete({
      where: { wardid },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลผู้ใช้สำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ DELETE /api/warduser/[wardid] error:', error);

    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบได้ เนื่องจากมีข้อมูลที่เกี่ยวข้องในระบบ',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete ward user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}