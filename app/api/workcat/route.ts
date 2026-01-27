import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET: ดึงข้อมูล WorkCat ทั้งหมด
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // สร้าง filter
    const where: any = {};

    if (search) {
      where.OR = [
        { catname: { contains: search } },
        { catnameopd: { contains: search } },
        { catnameer: { contains: search } },
      ];
    }

    // Query ข้อมูล
    const workCats = await prisma.workCat.findMany({
      where,
      orderBy: {
        catid: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: workCats,
      count: workCats.length,
    });
  } catch (error) {
    console.error('❌ GET /api/workcat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: สร้าง WorkCat ใหม่
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.catname) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    const existingCat = await prisma.workCat.findUnique({
      where: { catname: body.catname },
    });

    if (existingCat) {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    // สร้างข้อมูลใหม่
    const newWorkCat = await prisma.workCat.create({
      data: {
        catname: body.catname,
        catnameopd: body.catnameopd || null,
        catnameer: body.catnameer || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newWorkCat,
      message: 'เพิ่มหมวดหมู่สำเร็จ',
    });
  } catch (error: any) {
    console.error('❌ POST /api/workcat error:', error);

    // ตรวจสอบ Unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}