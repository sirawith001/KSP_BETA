import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id'); // รับ ID ของ User มา

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // ดึงแจ้งเตือนของ User คนนี้
    const notifications = await prisma.notification.findMany({
      where: { 
        receiverId: parseInt(userId) 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      take: 20 // เอาแค่ 20 อันล่าสุด
    });

    // นับจำนวนที่ยังไม่ได้อ่าน
    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: parseInt(userId),
        isRead: false
      }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}