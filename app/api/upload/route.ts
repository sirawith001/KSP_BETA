// app/api/upload/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(request: Request) {
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: "No file uploaded" });
  }

  // แปลง File เป็น Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ตั้งชื่อไฟล์ใหม่ (กันชื่อซ้ำ) เช่น 1709123456-my-image.jpg
  const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
  
  // ระบุ Path ที่จะเก็บ (เก็บใน public/uploads เพื่อให้เข้าถึงได้ผ่าน URL)
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const filePath = path.join(uploadDir, filename);

  try {
    // เขียนไฟล์ลงเครื่อง
    await writeFile(filePath, buffer);
    
    // ส่ง URL กลับไปให้ Frontend (เช่น /uploads/1709...jpg)
    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${filename}` 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" });
  }
}