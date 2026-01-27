// import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // Define an interface for the where condition object
// interface WhereCondition {
//   wopderdate?: {
//     gte: Date;
//     lte: Date;
//   };
//   wardid?: number;
// }

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
    
//     const date = searchParams.get('date');
//     const month = searchParams.get('month');
//     const year = searchParams.get('year');
//     const wardid = searchParams.get('wardid');

//     let whereCondition: WhereCondition = {};
    
//     if (date && month && year) {
//       // ใช้ timezone +07:00 (เวลาไทย) แทน UTC
//       const dateStr = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
      
//       // เริ่มต้นวัน 00:00:00 และสิ้นสุดวัน 23:59:59 ในเวลาไทย
//       const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
//       const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);
      
//       whereCondition.wopderdate = {
//         gte: startDate,
//         lte: endDate  // เปลี่ยนจาก lt เป็น lte
//       };
//     }

//     if (wardid && wardid !== '') {
//       whereCondition.wardid = parseInt(wardid);
//     }

//     const workOpders = await prisma.workOpder.findMany({
//       where: whereCondition,
//       include: {
//         ward: {
//           select: {
//             wardid: true,
//             wardname: true,
//             warduser: true
//           }
//         },
//         category: {
//           select: {
//             catid: true,
//             catname: true,
//             catnameopd: true,
//             catnameer: true
//           }
//         }
//       },
//       orderBy: {
//         wopderid: 'asc'
//       }
//     });

//     console.log('Query conditions:', whereCondition); // เพิ่ม log เพื่อ debug
//     console.log('Found records:', workOpders.length);

//     return NextResponse.json({
//       success: true,
//       data: workOpders,
//       count: workOpders.length
//     });

//   } catch (error: unknown) {
//     console.error('Error fetching workopder:', error);
    
//     // Type assertion for error object to access message safely
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Failed to fetch workopder data',
//         message: errorMessage 
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Interface for POST request body
// interface PostRequestBody {
//   wopderg1?: number;
//   wopderg2?: number;
//   wopderg3?: number;
//   wopderg4?: number;
//   wopderg5?: number;
//   wopderg6?: string;
//   wardid?: string | number;
//   catid?: string | number;
//   wopderdate?: string;
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body: PostRequestBody = await request.json();
//     const {
//       wopderg1,
//       wopderg2,
//       wopderg3,
//       wopderg4,
//       wopderg5,
//       wopderg6,
//       wardid,
//       catid,
//       wopderdate
//     } = body;

//     if (!wardid || !wopderdate) {
//       return NextResponse.json(
//         { success: false, error: 'wardid and wopderdate are required' },
//         { status: 400 }
//       );
//     }

//     const newWorkOpder = await prisma.workOpder.create({
//       data: {
//         wopderg1: wopderg1 || 0,
//         wopderg2: wopderg2 || 0,
//         wopderg3: wopderg3 || 0,
//         wopderg4: wopderg4 || 0,
//         wopderg5: wopderg5 || 0,
//         wopderg6: wopderg6 || null,
//         wardid: typeof wardid === 'string' ? parseInt(wardid) : wardid,
//         catid: catid ? (typeof catid === 'string' ? parseInt(catid) : catid) : null,
//         wopderdate: new Date(`${wopderdate}T00:00:00.000+07:00`)
//       },
//       include: {
//         ward: true,
//         category: true
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       data: newWorkOpder
//     }, { status: 201 });

//   } catch (error: unknown) {
//     console.error('Error creating workopder:', error);
    
//     // Type assertion for error object to access message safely
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Failed to create workopder',
//         message: errorMessage 
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface WhereCondition {
  wopderdate?: {
    gte: Date;
    lte: Date;  // ⭐ เปลี่ยนจาก lt เป็น lte
  };
  wardid?: number;
  catid?: {
    not: null;  // ⭐ กรองเฉพาะที่มี catid
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const wardid = searchParams.get('wardid');

    console.log('🏥 OPD/ER API Params:', { date, month, year, wardid });

    let whereCondition: WhereCondition = {};
    
    // ⭐ กรองเฉพาะ records ที่มี catid (ป้องกันข้อมูลเสีย)
    whereCondition.catid = { not: null };
    
    if (date && month && year) {
      let searchYear = parseInt(year);
      
      // แปลง พ.ศ. เป็น ค.ศ.
      if (searchYear > 2400) {
        searchYear = searchYear - 543;
      }

      // ⭐ ใช้ Local Time แทน UTC (เหมือน workadds)
      const y = searchYear;
      const m = parseInt(month) - 1;
      const d = parseInt(date);

      const startDate = new Date(y, m, d, 0, 0, 0, 0);
      const endDate = new Date(y, m, d, 23, 59, 59, 999);
      
      console.log('📅 OPD/ER Date Range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        local: startDate.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        formatted: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      });

      whereCondition.wopderdate = {
        gte: startDate,
        lte: endDate  // ⭐ ใช้ lte แทน lt
      };
    }

    if (wardid && wardid !== '' && wardid !== 'null') {
      whereCondition.wardid = parseInt(wardid);
      console.log('✅ Filtering by wardid:', whereCondition.wardid);
    }

    console.log('🔎 Final WHERE clause:', JSON.stringify(whereCondition, null, 2));

    const workOpders = await prisma.workOpder.findMany({
      where: whereCondition,
      include: {
        ward: {
          select: {
            wardid: true,
            wardname: true,
            warduser: true
          }
        },
        category: {
          select: {
            catid: true,
            catname: true,
            catnameopd: true,
            catnameer: true
          }
        }
      },
      orderBy: {
        wopderid: 'asc'
      }
    });

    console.log(`✅ Found ${workOpders.length} OPD/ER records`);
    
    // ⭐ Debug: แสดง records ที่ไม่มี category
    const missingCategory = workOpders.filter(item => !item.category);
    if (missingCategory.length > 0) {
      console.warn(`⚠️ ${missingCategory.length} records missing category:`, 
        missingCategory.map(r => ({ id: r.wopderid, catid: r.catid }))
      );
    }

    // ⭐ Debug: แสดง sample record
    if (workOpders.length > 0) {
      console.log('📊 Sample OPD/ER record:', {
        wopderid: workOpders[0].wopderid,
        wardid: workOpders[0].wardid,
        catid: workOpders[0].catid,
        catnameopd: workOpders[0].category?.catnameopd,
        catnameer: workOpders[0].category?.catnameer,
        wopderdate: workOpders[0].wopderdate
      });
    }

    return NextResponse.json({
      success: true,
      data: workOpders,
      count: workOpders.length
    });

  } catch (error: unknown) {
    console.error('❌ Error fetching workopder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workopder data',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

// ⭐ เพิ่ม POST method สำหรับบันทึกข้อมูล
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.wardid || !body.catid || !body.wopderdate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: wardid, catid, wopderdate' },
        { status: 400 }
      );
    }

    const data = {
      wardid: parseInt(body.wardid),
      catid: parseInt(body.catid),
      wopderg1: parseInt(body.wopderg1 || 0),
      wopderg2: parseInt(body.wopderg2 || 0),
      wopderg3: parseInt(body.wopderg3 || 0),
      wopderg4: parseInt(body.wopderg4 || 0),
      wopderg5: parseInt(body.wopderg5 || 0),
      wopderg6: body.wopderg6 || '',
      wopderdate: new Date(body.wopderdate),
    };

    const newRecord = await prisma.workOpder.create({
      data,
      include: {
        ward: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: 'บันทึกข้อมูล OPD/ER สำเร็จ',
    });

  } catch (error: any) {
    console.error('❌ POST /api/workopder error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'มีข้อมูลสำหรับ ward และ category นี้ในวันนี้แล้ว' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create OPD/ER data' },
      { status: 500 }
    );
  }
}