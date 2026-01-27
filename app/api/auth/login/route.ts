import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { warduser, wardpass } = await req.json();

    if (!warduser || !wardpass) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    const user = await prisma.wardUser.findUnique({
      where: { warduser },
      select: {
        wardid: true,
        warduser: true,
        wardpass: true,
        wardname: true,
        role: true,
        department: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้งานนี้ในระบบ" },
        { status: 404 }
      );
    }

    if (user.wardpass !== wardpass) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        wardid: user.wardid,
        warduser: user.warduser,
        wardname: user.wardname,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        wardid: user.wardid,
        warduser: user.warduser,
        wardname: user.wardname,
        role: user.role,
        department: user.department,
      },
    });

    // 🔥 ตั้งค่า cookie options แยก
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    };

    // ✅ Set cookies ทั้งหมด
    response.cookies.set('token', token, cookieOptions);
    response.cookies.set('role', user.role || '', cookieOptions);
    response.cookies.set('department', user.department || '', cookieOptions);
    response.cookies.set('wardname', user.wardname || '', cookieOptions); 

    console.log('✅ Login successful:', {
      warduser: user.warduser,
      wardname: user.wardname,
      role: user.role,
      department: user.department,
    });

    return response;

  } catch (err) {
    console.error("❌ Login API Error:", err);
    return NextResponse.json(
      { error: "เซิร์ฟเวอร์ผิดพลาด" },
      { status: 500 }
    );
  }
}