import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// แก้ไข 1: กำหนด Type ให้รองรับ Promise
interface RouteParams {
  params: Promise<{ id: string }>;
}

// ✅ 1. PATCH: กดอ่าน
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    // แก้ไข 2: ต้อง await params ก่อนใช้งาน
    const resolvedParams = await params;
    const notid = parseInt(resolvedParams.id);

    if (isNaN(notid)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { notid: notid },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error Updating:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ✅ 2. DELETE: ลบ
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    // แก้ไข 2: ต้อง await params เหมือนกัน
    const resolvedParams = await params;
    const notid = parseInt(resolvedParams.id);

    if (isNaN(notid)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { notid: notid },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error Deleting:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}