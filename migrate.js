const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 1. ตั้งค่าการเชื่อมต่อ Database เก่า
const oldDbConfig = {
  host: 'localhost',
  user: 'root',      // แก้ username
  password: '',      // แก้ password
  database: 'workloaddb_old', // ชื่อ DB ต้นทาง
  dateStrings: true, // สำคัญ! รับค่าวันที่เป็น string
};

// --- Helper: แปลงชื่อเดือนไทยเป็นตัวเลข ---
const THAI_MONTHS = {
  'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 'พฤษภาคม': 4, 'มิถุนายน': 5,
  'กรกฎาคม': 6, 'สิงหาคม': 7, 'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
};

// --- Helper: ฟังก์ชันแปลงวันที่แบบกู้คืนข้อมูล ---
function parseDateSafe(dateStr, thaiDateStr) {
  const isValid = (d) => d instanceof Date && !isNaN(d) && d.getFullYear() > 1900;

  if (dateStr && dateStr !== '0000-00-00') {
    const d = new Date(dateStr);
    if (isValid(d)) return d;
  }

  if (thaiDateStr && typeof thaiDateStr === 'string') {
    try {
      const parts = thaiDateStr.trim().split(/\s+/);
      let day = 1, month = 0, year = new Date().getFullYear();

      const yearPart = parts.find(p => p.match(/^[2][4-6]\d{2}$/));
      if (yearPart) year = parseInt(yearPart) - 543;

      const monthPart = parts.find(p => THAI_MONTHS[p] !== undefined);
      if (monthPart) month = THAI_MONTHS[monthPart];

      const dayPart = parts.find(p => p.match(/^\d{1,2}$/) && parseInt(p) < 32);
      if (dayPart) day = parseInt(dayPart);

      const recovered = new Date(year, month, day);
      if (isValid(recovered)) return recovered;
    } catch (e) {}
  }

  return new Date(); 
}

// --- 1. ย้ายหมวดหมู่ ---
async function migrateWorkCat() {
  console.log('🔄 1. ย้าย WorkCat...');
  const conn = await mysql.createConnection(oldDbConfig);
  const [rows] = await conn.execute('SELECT * FROM workcat');
  
  for (const row of rows) {
    await prisma.workCat.upsert({
      where: { catid: row.catid },
      update: { catname: row.catname },
      create: {
        catid: row.catid,
        catname: row.catname,
        catnameopd: row.catnameopd || null,
        catnameer: row.catnameer || null,
      },
    });
  }
  console.log(`✅ WorkCat เสร็จ (${rows.length})`);
  await conn.end();
}

// --- 2. ย้ายผู้ใช้ ---
async function migrateWardUser() {
  console.log('🔄 2. ย้าย WardUser...');
  const conn = await mysql.createConnection(oldDbConfig);
  const [rows] = await conn.execute('SELECT * FROM warduser');
  
  for (const row of rows) {
    let newRole = 'USER', newDept = 'USER';
    if (row.wardstatus === '1') { newRole = 'ADMIN'; newDept = 'ADMINMINI'; }
    else if (row.wardstatus === '2') { newDept = 'OPD'; }
    else if (row.wardstatus === '3') { newDept = 'ER'; }

    await prisma.wardUser.upsert({
      where: { wardid: row.wardid },
      update: { warduser: row.warduser },
      create: {
        wardid: row.wardid,
        warduser: row.warduser,
        wardpass: row.wardpass,
        wardname: row.wardname,
        wardstatus: row.wardstatus,
        warddest: row.warddest ? String(row.warddest) : null,
        role: newRole,
        department: newDept,
      },
    });
  }
  console.log(`✅ WardUser เสร็จ (${rows.length})`);
  await conn.end();
}

// --- 3. ย้ายข้อมูลภาระงาน---
async function migrateWorkAdd() {
  console.log('🔄 3. ย้าย WorkAdd (กำลังประมวลผล)...');
  const conn = await mysql.createConnection(oldDbConfig);
  
  const [rows] = await conn.execute('SELECT * FROM workadd');
  console.log(`📂 เจอข้อมูลต้นทางทั้งหมด ${rows.length} รายการ`);
  
  let count = 0, success = 0, errorCount = 0;

  for (const row of rows) {
    count++;
    try {
        const validDate = parseDateSafe(row.wdates, row.wdateth);

        // เตรียมข้อมูล
        const dataBody = {
            ward: { connect: { wardid: row.wardid } },
            category: { connect: { catid: row.catid } },
            wdates: validDate,
            wdateth: row.wdateth || '',
            
            ws1: row.ws1 || 0, ws2: row.ws2 || 0, ws3: row.ws3 || 0, ws4: row.ws4 || 0, ws5: row.ws5 || 0,
            ws6: row.ws6 || 0, ws7: row.ws7 || 0, ws8: row.ws8 || 0, ws9: row.ws9 || 0, ws10: row.ws10 || 0,
            
            wa1: row.wa1 || 0, wa2: row.wa2 || 0, wa11: row.wa11 || 0, wa22: row.wa22 || 0,
            
            wdc1: row.wdc1 || 0, wdc2: row.wdc2 || 0, wdc3: row.wdc3 || 0, wdc4: row.wdc4 || 0,
            wdc5: row.wdc5 || 0, wdc6: row.wdc6 || 0, wdc7: row.wdc7 || 0,
            
            wdc11: row.wdc11 || 0, wdc22: row.wdc22 || 0, wdc33: row.wdc33 || 0, wdc44: row.wdc44 || 0,
            wdc55: row.wdc55 || 0, wdc66: row.wdc66 || 0, wdc77: row.wdc77 || 0,
            
            wn1: row.wn1 || 0, wrn1: row.wrn1 || 0, wrn2: row.wrn2 || 0,
            wpn1: row.wpn1 || 0, wpn2: row.wpn2 || 0, wna1: row.wna1 || 0, wna2: row.wna2 || 0,
        };

        await prisma.workAdd.upsert({
            // ✅ แก้ไขจุดสำคัญ: เช็คที่ wid โดยตรง (ป้องกันข้อมูลหาย)
            where: { 
                wid: row.wid 
            },
            // ถ้าเจอ: อัปเดตข้อมูลปกติ
            update: dataBody,
            // ถ้าไม่เจอ: สร้างใหม่โดยระบุ wid เดิมลงไป
            create: {
                wid: row.wid, 
                ...dataBody
            }
        });
        
        success++;
    } catch (error) {
        errorCount++;
        console.error(`❌ Error ID ${row.wid}: ${error.message}`);
    }

    if (count % 2000 === 0) {
        console.log(`... ทำไปแล้ว ${count} / ${rows.length} (ผ่าน: ${success})`);
    }
  }

  console.log(`✅ จบงาน WorkAdd! สำเร็จ: ${success}, พลาด: ${errorCount}`);
  await conn.end();
}

async function main() {
  try {
    await prisma.$connect();
    await migrateWorkCat();
    await migrateWardUser();
    await migrateWorkAdd();
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();