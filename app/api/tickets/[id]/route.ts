import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==============================================================================
// 1. GET: ดึงข้อมูล Ticket ตาม ID (เผื่อต้องใช้ดึงข้อมูลเดี่ยวๆ)
// ==============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type รองรับ Next.js 15
) {
  try {
    const { id } = await params; // ✅ ต้อง await ก่อน
    const ticketId = Number(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid Ticket ID" }, { status: 400 });
    }

    const ticket = await prisma.reportTicket.findUnique({
      where: { ticketId },
      include: {
        reporter: true,
        assignee: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// ==============================================================================
// 2. PATCH: อัพเดตสถานะ / รับงาน / ปิดงาน
// ==============================================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type รองรับ Next.js 15
) {
  try {
    const { id } = await params; // ✅ ต้อง await ก่อน
    const ticketId = Number(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid Ticket ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, assigneeId } = body;

    // เตรียมข้อมูลที่จะอัพเดต
    const updateData: any = { status };

    // --- Logic 1: จัดการวันจบงาน ---
    if (status === "RESOLVED") {
      updateData.finishedAt = new Date(); // จบงานใส่วันที่
    } else if (status === "IN_PROGRESS" || status === "PENDING") {
      updateData.finishedAt = null; // เปิดใหม่ เคลียร์วันที่จบ
    }

    // --- Logic 2: จัดการคนรับงาน (Assignee) ---
    // ถ้ามีการส่ง assigneeId มา (ไม่ใช่ undefined)
    if (assigneeId !== undefined) {
      // ถ้าค่าที่ส่งมาไม่ใช่ null ให้แปลงเป็นตัวเลข, ถ้าเป็น null ก็ให้เป็น null
      updateData.assigneeId = assigneeId ? Number(assigneeId) : null;
    }

    // ทำการอัพเดตลง DB
    const updatedTicket = await prisma.reportTicket.update({
      where: { ticketId },
      data: updateData,
    });

    return NextResponse.json(updatedTicket);

  } catch (error) {
    console.error("❌ PATCH ERROR:", error); // Log Error ดูใน Terminal
    return NextResponse.json(
      { error: "Update failed", details: String(error) }, 
      { status: 500 }
    );
  }
}

// ==============================================================================
// 3. DELETE: ลบ Ticket
// ==============================================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type รองรับ Next.js 15
) {
  try {
    const { id } = await params; // ✅ ต้อง await ก่อน
    const ticketId = Number(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid Ticket ID" }, { status: 400 });
    }

    // ลบข้อมูล
    await prisma.reportTicket.delete({
      where: { ticketId },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });

  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Delete failed", details: String(error) }, 
      { status: 500 }
    );
  }
}