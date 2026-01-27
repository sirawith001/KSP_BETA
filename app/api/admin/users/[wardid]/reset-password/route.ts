// app/api/admin/users/[wardid]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - รีเซ็ตรหัสผ่าน
export async function POST(
  request: NextRequest,
  // แก้ไขจุดที่ 1: เปลี่ยน Type ของ params เป็น Promise
  { params }: { params: Promise<{ wardid: string }> }
) {
  try {
    // แก้ไขจุดที่ 2: ต้อง await params ก่อนนำไปใช้
    const resolvedParams = await params;
    const wardid = parseInt(resolvedParams.wardid);

    const body = await request.json();
    const { newPassword } = body;

    // Validation
    if (!newPassword || newPassword.trim() === '') {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสผ่านใหม่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
    const existingUser = await prisma.wardUser.findUnique({
      where: { wardid }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      );
    }

    // Update password (plain text)
    await prisma.wardUser.update({
      where: { wardid },
      data: { 
        wardpass: newPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'รีเซ็ตรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้' },
      { status: 500 }
    );
  }
}