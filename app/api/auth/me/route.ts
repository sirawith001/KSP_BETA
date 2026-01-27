import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma"; // ⚠️ ตรวจสอบ path นี้ว่าตรงกับไฟล์ prisma client ของคุณ

export async function GET() {
  try {
    // 1. ดึง Token จาก Cookie ที่ชื่อ 'token'
    const cookieStore = cookies();
    const token = (await cookieStore).get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token found" },
        { status: 401 }
      );
    }

    // 2. แกะ Token (Verify JWT)
    // ต้องใช้ secret ตัวเดียวกับตอน Login
    const secret = process.env.JWT_SECRET || ""; 
    
    let decoded: any;
    try {
      decoded = jwt.verify(token.value, secret);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // 3. (Optional) ดึงข้อมูลล่าสุดจาก Database 
    // เพื่อความชัวร์ว่า User ยังมีอยู่จริง และ Role ไม่ได้ถูกเปลี่ยน
    const user = await prisma.wardUser.findUnique({
      where: {
        wardid: decoded.wardid, // ใช้ wardid จาก token ในการหา
      },
      select: {
        wardid: true,
        warduser: true,
        wardname: true,
        role: true,
        department: true,
        // ❌ ห้ามดึง wardpass กลับไปหน้าบ้านเด็ดขาด
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 4. ส่งข้อมูล User กลับไปให้หน้าบ้านใช้งาน
    return NextResponse.json(user);

  } catch (error) {
    console.error("ME API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}