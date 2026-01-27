import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET_TIMELINE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catid = searchParams.get('catid');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    if (!catid) {
      return NextResponse.json(
        { success: false, error: 'catid is required' },
        { status: 400 }
      );
    }

    // สร้าง filter
    const where: any = {
      catid: parseInt(catid),
    };

    if (startDate || endDate) {
      where.wdates = {};
      if (startDate) {
        where.wdates.gte = new Date(startDate);
      }
      if (endDate) {
        where.wdates.lte = new Date(endDate);
      }
    }

    // ดึงข้อมูล
    const records = await prisma.workAdd.findMany({
      where,
      select: {
        wdates: true,
        ws1: true,
        ws2: true,
        ws3: true,
        ws4: true,
        ws5: true,
        wa1: true,
        wa2: true,
        wdc1: true,
        wdc2: true,
        wdc3: true,
        wdc4: true,
        wdc5: true,
        wdc6: true,
      },
      orderBy: {
        wdates: 'asc',
      },
    });

    // จัดกลุ่มข้อมูลตาม groupBy
    const groupedData: any = {};

    records.forEach(record => {
      const date = new Date(record.wdates);
      let key: string;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          count: 0,
          totalPatients: 0,
          admissions: 0,
          discharges: 0,
        };
      }

      groupedData[key].count += 1;
      groupedData[key].totalPatients += 
        record.ws1 + record.ws2 + record.ws3 + record.ws4 + record.ws5;
      groupedData[key].admissions += record.wa1 + record.wa2;
      groupedData[key].discharges += 
        record.wdc1 + record.wdc2 + record.wdc3 + record.wdc4 + record.wdc5 + record.wdc6;
    });

    const timeline = Object.values(groupedData);

    return NextResponse.json({
      success: true,
      catid: parseInt(catid),
      groupBy,
      data: timeline,
      summary: {
        totalPeriods: timeline.length,
        totalRecords: records.length,
      },
    });
  } catch (error) {
    console.error('❌ GET /api/workcat/stats/timeline error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timeline statistics' },
      { status: 500 }
    );
  }
}