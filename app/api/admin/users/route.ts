// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - ดึงข้อมูลผู้ใช้ทั้งหมด (ไม่ส่ง password กลับไป)
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.wardUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        wardid: true,
        warduser: true,
        wardpass: false, // ⚠️ ไม่ส่ง password กลับไปแสดงใน table
        role: true,
        wardname: true,
        wardstatus: true,
        warddest: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ 
      users,
      total: users.length 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    );
  }
}

// POST - เพิ่มผู้ใช้ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warduser, wardpass, role, wardname, wardstatus, warddest } = body;

    // Validation
    if (!warduser || !wardpass) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
    const existingUser = await prisma.wardUser.findUnique({
      where: { warduser }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }

    // สร้างผู้ใช้ใหม่ (เก็บ plain text ตามที่ต้องการ)
    const newUser = await prisma.wardUser.create({
      data: {
        warduser,
        wardpass, // เก็บแบบ plain text
        role: role || 'USER',
        wardname: wardname || null,
        wardstatus: wardstatus || null,
        warddest: warddest || null,
      },
      select: {
        wardid: true,
        warduser: true,
        role: true,
        wardname: true,
        wardstatus: true,
        warddest: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      user: newUser,
      message: 'เพิ่มผู้ใช้สำเร็จ'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถเพิ่มผู้ใช้ได้' },
      { status: 500 }
    );
  }
}