import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";

export async function getAuthUser(request: Request): Promise<{ id: string; role: string } | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.id || !payload.role) return null;
  return { id: payload.id as string, role: payload.role as string };
}

export async function requireAdmin(request: Request): Promise<{ user: { id: string; role: string }; error?: NextResponse }> {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: { id: "", role: "" }, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin" && user.role !== "principal") {
    return { user, error: NextResponse.json({ error: "Forbidden: Admin or Principal only" }, { status: 403 }) };
  }
  return { user };
}

export async function requireTeacher(request: Request): Promise<{ user: { id: string; role: string }; error?: NextResponse }> {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: { id: "", role: "" }, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "teacher") {
    return { user, error: NextResponse.json({ error: "Forbidden: Teachers only" }, { status: 403 }) };
  }
  return { user };
}
