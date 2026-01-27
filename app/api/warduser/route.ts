import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET: ดึงข้อมูล WardUser ทั้งหมด
// ============================================
export async function GET() {
  try {
    const wardUsers = await prisma.wardUser.findMany({
      select: {
        wardid: true,
        warduser: true,
        wardname: true,
        wardstatus: true,
        warddest: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        wardid: 'asc',
      },
    });

    console.log('✅ Found', wardUsers.length, 'ward users');

    return NextResponse.json({
      success: true,
      data: wardUsers,
    });
  } catch (error) {
    console.error('❌ GET /api/warduser error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ward users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// POST: สร้าง WardUser ใหม่
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.warduser || !body.wardpass || !body.role) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const existingUser = await prisma.wardUser.findUnique({
      where: { warduser: body.warduser },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    // สร้าง user ใหม่
    const newUser = await prisma.wardUser.create({
      data: {
        warduser: body.warduser,
        wardpass: body.wardpass,
        role: body.role,
        wardname: body.wardname || null,
        wardstatus: body.wardstatus || null,
        warddest: body.warddest || null,
      },
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

    console.log('✅ Created new ward user:', newUser.wardname);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'สร้างผู้ใช้สำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ POST /api/warduser error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create ward user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}