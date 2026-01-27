import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const wards = await prisma.wardUser.findMany({
    where: { role: 'USER' }, // เอาเฉพาะ User ทั่วไป (ไม่เอา Admin)
    select: { wardid: true, warduser: true, wardname: true },
    orderBy: { wardname: 'asc' }
  });
  return NextResponse.json(wards);
}