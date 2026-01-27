// migrate_opd.js (เวอร์ชั่น Fix Date String - ผ่านชัวร์)
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const oldDbConfig = {
  host: 'localhost',
  user: 'root',      
  password: '',      
  database: 'workloaddb', 
  dateStrings: true, // ค่าที่ได้มาจะเป็น String อยู่แล้ว
};


function formatDateForSQL(dateStr) {
  // 1. ถ้าเจอค่าว่าง หรือ 0000-00-00 ให้ส่งกลับเป็น NULL (หรือ '1970-01-01 00:00:00' ถ้าฟิลด์ห้ามว่าง)
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') {
    return null; // ✅ ส่งค่า NULL เข้า DB ไปเลย (ต้องแก้ column ใน DB ให้รับ NULL ได้ด้วย)
    // หรือถ้า DB ห้าม NULL ให้ใช้: return '1900-01-01 00:00:00';
  }

  const d = new Date(dateStr);

  // 2. ถ้าแปลงไม่ได้ ก็ให้เป็น NULL เช่นกัน
  if (isNaN(d.getTime())) {
    return null; 
  }

  // 3. แก้ปี พ.ศ. (ถ้าปีมากกว่า 2400)
  if (d.getFullYear() > 2400) {
    d.setFullYear(d.getFullYear() - 543);
  }

  // 4. จัด Format ตัด Timezone
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function main() {
  console.log('🚀 เริ่มต้นย้ายข้อมูล WorkOpder (OPD) ด้วย Raw SQL + Date String ...');
  
  const conn = await mysql.createConnection(oldDbConfig);
  const [rows] = await conn.execute('SELECT * FROM workopder');
  console.log(`📥 พบข้อมูลต้นทางทั้งหมด ${rows.length} รายการ`);

  let count = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
        const catIdVal = (row.catid && row.catid !== 0) ? row.catid : null;
        
        // ✨ แก้ไขจุดสำคัญ: แปลงวันที่เป็น String ก่อนส่งเข้า SQL
        const dateValStr = formatDateForSQL(row.wopderdate);

        await prisma.$executeRaw`
            INSERT INTO workopder (
                wopderid, 
                wopderg1, wopderg2, wopderg3, wopderg4, wopderg5, wopderg6, 
                wopderdate, wardid, catid
            ) VALUES (
                ${row.wopderid}, 
                ${row.wopderg1 || 0}, ${row.wopderg2 || 0}, ${row.wopderg3 || 0}, ${row.wopderg4 || 0}, ${row.wopderg5 || 0}, ${row.wopderg6 || null}, 
                ${dateValStr}, ${row.wardid}, ${catIdVal}
            ) 
            ON DUPLICATE KEY UPDATE
                wopderg1 = VALUES(wopderg1),
                wopderg2 = VALUES(wopderg2),
                wopderg3 = VALUES(wopderg3),
                wopderg4 = VALUES(wopderg4),
                wopderg5 = VALUES(wopderg5),
                wopderg6 = VALUES(wopderg6),
                wopderdate = VALUES(wopderdate),
                wardid = VALUES(wardid),
                catid = VALUES(catid);
        `;

        count++;
        if (count % 100 === 0) console.log(`... บันทึกแล้ว ${count} รายการ`);

    } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
             console.error(`❌ Error ID ${row.wopderid}: ${error.message}`);
        }
    }
  }

  console.log('------------------------------------------------');
  console.log(`✅ ย้ายเสร็จสิ้น: ${count} รายการ`);
  console.log(`❌ ข้าม (Error): ${errorCount} รายการ`);
  console.log('------------------------------------------------');

  await conn.end();
  await prisma.$disconnect();
}

main();