import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงข้อมูลทั้งหมด
export async function GET() {
  try {
    const workCats = await prisma.workCat.findMany({
      orderBy: { catid: 'desc' },
    });

    return NextResponse.json({
      workCats,
      total: workCats.length,
    });
  } catch (error) {
    console.error('GET WorkCat Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    );
  }
}

// POST - เพิ่มข้อมูลใหม่
export async function POST(req: Request) {
  try {
    const { catname, catnameopd, catnameer } = await req.json();

    if (!catname) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    const existing = await prisma.workCat.findUnique({
      where: { catname },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    const newCat = await prisma.workCat.create({
      data: {
        catname,
        catnameopd: catnameopd || null,
        catnameer: catnameer || null,
      },
    });

    return NextResponse.json({
      message: 'เพิ่มหมวดหมู่สำเร็จ',
      workCat: newCat,
    }, { status: 201 });

  } catch (error) {
    console.error('POST WorkCat Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถเพิ่มข้อมูลได้' },
      { status: 500 }
    );
  }
}