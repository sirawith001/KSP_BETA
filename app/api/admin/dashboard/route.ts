import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ token จาก header
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // กำหนดเวลาเริ่มต้นและสิ้นสุดของวันนี้
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ดึงข้อมูลจาก database แบบ parallel
    const [
      totalUsers,
      totalWards,
      activeWards,
      todayWorkRecords,
      pendingRecords,
      notifications
    ] = await Promise.all([
      prisma.wardUser.count(),
      
    
      prisma.wardUser.count({
        where: {
          wardname: { 
            not: null 
          }
        }
      }),
      
    
      prisma.wardUser.count({
        where: {
          wardstatus: '1'
        }
      }),
      

      prisma.workAdd.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),

      prisma.workAdd.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          },
          OR: [
            { ws1: { gt: 0 } },
            { ws2: { gt: 0 } },
            { ws3: { gt: 0 } },
            { ws4: { gt: 0 } },
            { ws5: { gt: 0 } }
          ],
          // ยังไม่มี discharge
          wdc1: 0,
          wdc2: 0,
          wdc3: 0,
          wdc4: 0,
          wdc5: 0,
          wdc6: 0,
          wdc7: 0
        }
      }),
      
      // ============================================================
      // ✨ 6. แก้ไข: นับการแจ้งเตือนจาก ReportTicket
      // ============================================================
      prisma.reportTicket.count({
        where: {
          status: 'PENDING' 
        }
      })
    ]);

    // ดึงกิจกรรมล่าสุด 5 รายการ
    const recentActivities = await prisma.workAdd.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        ward: {
          select: {
            warduser: true,
            wardname: true
          }
        },
        category: {
          select: {
            catname: true
          }
        }
      }
    });

    // Format กิจกรรมให้อ่านง่าย
    const formattedActivities = recentActivities.map((activity) => {
      // สร้างข้อความอธิบายกิจกรรม
      let actionText = `บันทึกข้อมูล ${activity.category.catname}`;
      
      // เพิ่มรายละเอียดผู้ป่วย
      const patientCount = activity.ws1 + activity.ws2 + activity.ws3 + activity.ws4 + activity.ws5;
      if (patientCount > 0) {
        actionText += ` (${patientCount} ราย)`;
      }

      // แสดง admit
      if (activity.wa1 > 0 || activity.wa2 > 0) {
        actionText += ` - Admit: ${activity.wa1 + activity.wa2} ราย`;
      }

      // แสดง discharge
      const dcCount = activity.wdc1 + activity.wdc2 + activity.wdc3 + activity.wdc4 + activity.wdc5 + activity.wdc6 + activity.wdc7;
      if (dcCount > 0) {
        actionText += ` - DC: ${dcCount} ราย`;
      }

      return {
        id: activity.wid,
        action: actionText,
        user: activity.ward.warduser,
        ward: activity.ward.wardname || 'ไม่ระบุหอผู้ป่วย',
        timestamp: new Date(activity.createdAt).toLocaleString('th-TH', {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    // Return ข้อมูลทั้งหมด
    return NextResponse.json({
      totalUsers,
      totalWards,
      activeWards,
      todayWorkRecords,
      pendingRecords,
      notifications, // ค่านี้จะเป็นจำนวน Ticket ที่เป็น PENDING
      recentActivities: formattedActivities
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}