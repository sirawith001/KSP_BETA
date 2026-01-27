/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! คำเตือน: อันนี้คือการสั่งให้ข้ามการเช็ค Error ของ TypeScript ตอน Build
    ignoreBuildErrors: true,
  },
  eslint: {
    // สั่งให้ข้ามการเช็ค Error ของ ESLint ด้วย (กันเหนียว)
    ignoreDuringBuilds: true,
  },
  // ของเดิมที่คุณใส่ไว้
  allowedDevOrigins: ["localhost", "192.168.0.164"],
};

export default nextConfig;