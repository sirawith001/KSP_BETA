import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { wardname, warduser, wardpass } = await req.json();

    if (!wardname || !warduser || !wardpass) {
      return NextResponse.json(
        { error: "กรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    const exist = await prisma.wardUser.findUnique({
      where: { warduser },
    });

    if (exist) {
      return NextResponse.json(
        { error: "มีชื่อผู้ใช้นี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const user = await prisma.wardUser.create({
      data: {
        wardname,
        warduser,
        wardpass, // ตามที่บอก: plain text
        role: "USER",
      },
    });

    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      user,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
