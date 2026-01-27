import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: ดึงรายการ Ticket ทั้งหมด
export async function GET(request: Request) {
  try {
    const tickets = await prisma.reportTicket.findMany({
      include: {
        reporter: {
          select: { warduser: true, wardname: true }, // ดึงชื่อคนแจ้ง
        },
        assignee: {
          select: { warduser: true, wardname: true }, // ดึงชื่อช่าง/admin
        },
      },
      orderBy: [
        { priority: "desc" }, // เรียงตามความด่วน (CRITICAL ขึ้นก่อน)
        { createdAt: "desc" }, // เรียงตามเวลาล่าสุด
      ],
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// 2. POST: สร้างใบแจ้งปัญหาใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, location, category, priority, reporterId, photoUpload } = body;

    // TODO: ส่วน photoUpload ต้องทำระบบ Upload File แยก (เช่น S3 หรือ Local) 
    // ในที่นี้สมมติว่าส่งเป็น String URL มาก่อน

    const newTicket = await prisma.reportTicket.create({
      data: {
        title,
        description,
        location,
        category, // "SYSTEM" | "GENERAL"
        priority, // "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
        reporterId: Number(reporterId), // รับ ID ของคนแจ้งมา
        status: "PENDING",
        photoUpload: photoUpload || null,
      },
    });

    return NextResponse.json(newTicket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}