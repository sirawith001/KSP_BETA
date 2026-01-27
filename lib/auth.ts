// lib/auth.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// ✅ แก้ interface ให้ตรงกับ WardUser
export interface TokenPayload {
  wardid: number;
  warduser: string;
  role: "USER" | "ADMIN";
}

// ✅ ฟังก์ชันดึงข้อมูล user จาก token
function getUserFromRequest(req: NextRequest): TokenPayload {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { wardid: 0, warduser: "GUEST", role: "USER" as const };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("JWT Verification Failed:", error);
    return { wardid: 0, warduser: "GUEST", role: "USER" as const };
  }
}

// ✅ ต้อง login (USER หรือ ADMIN)
export function requireAuth(req: NextRequest): TokenPayload {
  const user = getUserFromRequest(req);
  if (user.warduser === "GUEST") {
    throw new Error("Unauthorized: Login required");
  }
  return user;
}

// ✅ ต้องเป็น ADMIN เท่านั้น
export function requireAdmin(req: NextRequest): TokenPayload {
  const user = requireAuth(req);
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin only");
  }
  return user;
}

// ✅ ต้องเป็นเจ้าของหรือ Admin
export function requireOwnerOrAdmin(
  req: NextRequest,
  resourceWardId: number // 👈 เปลี่ยนจาก userId เป็น wardId
): TokenPayload {
  const user = requireAuth(req);
  if (user.role !== "ADMIN" && user.wardid !== resourceWardId) {
    throw new Error("Forbidden: Not your resource");
  }
  return user;
}

// ✅ อนุญาตทุกคน
export function allowAll(req: NextRequest): TokenPayload {
  return getUserFromRequest(req);
}

// ✅ อนุญาต USER + ADMIN (ไม่รวม GUEST)
export function requireUser(req: NextRequest): TokenPayload {
  const user = getUserFromRequest(req);
  if (user.warduser === "GUEST") {
    throw new Error("Forbidden: User or Admin only");
  }
  return user;
}