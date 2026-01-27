import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - แก้ไขข้อมูล
export async function PUT(
  req: Request,
  { params }: { params: { catid: string } }
) {
  try {
    const catid = parseInt(params.catid);
    const { catname, catnameopd, catnameer } = await req.json();

    if (!catname) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า catid มีอยู่หรือไม่
    const existing = await prisma.workCat.findUnique({
      where: { catid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าชื่อซ้ำกับของอื่นหรือไม่
    const duplicate = await prisma.workCat.findFirst({
      where: {
        catname,
        NOT: { catid },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    const updated = await prisma.workCat.update({
      where: { catid },
      data: {
        catname,
        catnameopd: catnameopd || null,
        catnameer: catnameer || null,
      },
    });

    return NextResponse.json({
      message: 'แก้ไขสำเร็จ',
      workCat: updated,
    });

  } catch (error) {
    console.error('PUT WorkCat Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถแก้ไขข้อมูลได้' },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อมูล
export async function DELETE(
  req: Request,
  { params }: { params: { catid: string } }
) {
  try {
    const catid = parseInt(params.catid);

    const existing = await prisma.workCat.findUnique({
      where: { catid },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'ไม่พบหมวดหมู่นี้' },
        { status: 404 }
      );
    }

    await prisma.workCat.delete({
      where: { catid },
    });

    return NextResponse.json({
      message: 'ลบสำเร็จ',
    });

  } catch (error) {
    console.error('DELETE WorkCat Error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบข้อมูลได้' },
      { status: 500 }
    );
  }
}