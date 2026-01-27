import { prisma } from '@/lib/prisma'; // ปรับ path ตามจริง
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, senderId, targetWardId, type } = body;

    // กรณีที่ 1: ส่งหาทุกคน (Broadcast)
    if (targetWardId === 'ALL') {
      // 1. หา WardUser ทั้งหมด (อาจจะเว้น Admin หรือไม่ก็ได้ตาม logic)
      const allUsers = await prisma.wardUser.findMany({
        where: { role: 'USER' }, // ส่งหาเฉพาะ USER ไม่รวม ADMIN
        select: { wardid: true }
      });

      // 2. เตรียมข้อมูลสำหรับ createMany
      const notificationsData = allUsers.map((user) => ({
        title,
        message,
        senderId: senderId, // Admin ID
        receiverId: user.wardid,
        type: type || 'INFO',
      }));

      // 3. บันทึกลง DB ทีเดียว
      await prisma.notification.createMany({
        data: notificationsData,
      });

      return NextResponse.json({ success: true, count: notificationsData.length });
    }

    // กรณีที่ 2: ส่งหาเจาะจง (Specific User)
    else {
      const newNoti = await prisma.notification.create({
        data: {
          title,
          message,
          senderId: senderId,
          receiverId: parseInt(targetWardId),
          type: type || 'INFO',
        },
      });

      return NextResponse.json(newNoti);
    }

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}