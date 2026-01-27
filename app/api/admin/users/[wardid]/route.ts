import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. แก้ไข Type และ await ในฟังก์ชัน PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wardid: string }> } // <-- เปลี่ยน Type ตรงนี้เป็น Promise
) {
  try {
    const resolvedParams = await params; // <-- เพิ่มบรรทัดนี้เพื่อรอค่า (Unwrap)
    const wardid = parseInt(resolvedParams.wardid); // <-- ใช้ค่าจากตัวแปรที่ await แล้ว

    const body = await request.json();
    const { wardpass, role, wardname, wardstatus, warddest } = body;

    // ... (โค้ดส่วนตรวจสอบ existingUser และ updateData เหมือนเดิม) ...

    const existingUser = await prisma.wardUser.findUnique({
      where: { wardid }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
    }

    const updateData: any = {
      role,
      wardname: wardname || null,
      wardstatus: wardstatus || null,
      warddest: warddest || null,
    };

    if (wardpass && wardpass.trim() !== '') {
      updateData.wardpass = wardpass;
    }

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
        updatedAt: true,
      }
    });

    return NextResponse.json({ 
      user: updatedUser,
      message: 'แก้ไขข้อมูลสำเร็จ'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถแก้ไขข้อมูลได้' },
      { status: 500 }
    );
  }
}

// 2. อย่าลืมแก้ฟังก์ชัน DELETE ด้วย (เพราะใช้ params เหมือนกัน)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wardid: string }> } // <-- เปลี่ยน Type เป็น Promise
) {
  try {
    const resolvedParams = await params; // <-- เพิ่มบรรทัดนี้
    const wardid = parseInt(resolvedParams.wardid); // <-- ใช้ค่าที่ await แล้ว

    const existingUser = await prisma.wardUser.findUnique({
      where: { wardid }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
    }

    await prisma.wardUser.delete({
      where: { wardid }
    });

    return NextResponse.json({ 
      message: 'ลบผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบผู้ใช้ได้' },
      { status: 500 }
    );
  }
}