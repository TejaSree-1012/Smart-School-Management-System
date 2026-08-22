import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
import connectDB from "@/app/lib/mongodb";
import Student from "@/app/models/Student";
import Teacher from "@/app/models/Teacher";
import Admin from "@/app/models/Admin";
import Principal from "@/app/models/Principal";
import Parent from "@/app/models/Parent";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = await verifyToken(token);
  
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let userData: Record<string, unknown> = {
    id: payload.id,
    role: payload.role
  };

  try {
    await connectDB();

    if (payload.role === "student") {
      const student = await Student.findById(payload.id).select("studentName classApplying studentId");
      if (student) {
        userData = {
          ...userData,
          name: student.studentName,
          class: student.classApplying,
          studentId: student.studentId
        };
      }
    } else if (payload.role === "teacher") {
      const teacher = await Teacher.findById(payload.id).select("name email");
      if (teacher) {
        userData = {
          ...userData,
          name: teacher.name,
          email: teacher.email
        };
      }
    } else if (payload.role === "admin") {
      const admin = await Admin.findById(payload.id).select("name email");
      if (admin) {
        userData = {
          ...userData,
          name: admin.name,
          email: admin.email
        };
      }
    } else if (payload.role === "principal") {
      const principal = await Principal.findById(payload.id).select("name email");
      if (principal) {
        userData = {
          ...userData,
          name: principal.name,
          email: principal.email
        };
      }
    } else if (payload.role === "parent") {
      // Parent login: token stores student's _id with role "parent"
      // We need to find the student using student's _id directly
      let student = null;
      
      try {
        // Try to find student by _id (since token stores student._id for parent login)
        student = await Student.findById(payload.id);
      } catch (e) {
        // If that fails, try finding by studentId string (exact match)
        student = await Student.findOne({ studentId: payload.id });
      }
      
      if (student) {
        userData = {
          ...userData,
          name: student.fatherName || "Parent",
          email: student.email || "",
          phone: student.phone || "",
          studentId: student.studentId,
          studentName: student.studentName,
          studentClass: student.classApplying
        };
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
  
  return NextResponse.json({ user: userData });
}
