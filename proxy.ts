import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // ให้ API routes ผ่านไปก่อนเลย
  if (path.startsWith('/api/')) {
    console.log('✅ API route - passing through:', path);
    return NextResponse.next();
  }
  
  // ดึง token และ department จาก cookie
  const token = request.cookies.get('token')?.value;
  const department = request.cookies.get('department')?.value;
  
  console.log('🔍 proxy:', { path, hasToken: !!token, department });

  // ถ้าอยู่หน้า login และมี token แล้ว -> redirect ไปหน้าหลัก
  if (path === '/login' && token) {
    console.log('🚫 Already logged in, redirecting...');
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // ตรวจสอบว่ามี token ก่อน ถึงค่อยเช็ค department สำหรับ ADMINMINI
  if (path.startsWith('/adminmini')) {
    // ถ้าไม่มี token ให้ redirect ไป login ก่อน
    if (!token) {
      console.log('🔒 No token, redirecting to login...');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ถ้ามี token แล้ว แต่ไม่ใช่ ADMINMINI
    if (department !== 'ADMINMINI') {
      console.log('⛔ Forbidden: Only ADMINMINI can access this page.');
      return NextResponse.redirect(new URL('/no-access', request.url));
    }
  }

  // ถ้าพยายามเข้าหน้า protected แต่ไม่มี token
  const protectedPaths = ['/admin', '/user', '/opd_er'];
  const isProtected = protectedPaths.some(p => path.startsWith(p));
  
  if (isProtected && !token) {
    console.log('🔒 Protected route without token, redirecting to login...');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/adminmini/:path*',
    '/user/:path*',
    '/opd_er/:path*',
  ],
};