import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "เข้าถึงข้อมูลลับได้แล้ว 🎉" });
}
