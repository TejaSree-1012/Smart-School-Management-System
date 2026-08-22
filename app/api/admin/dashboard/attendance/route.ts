import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Student from "@/app/models/Student";
import Attendance from "@/app/models/Attendance";

const TOTAL_WORKING_DAYS = 220;

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verifyToken } = await import("@/app/lib/jwt");
    const payload = await verifyToken(token);
    
    if (!payload || (payload.role !== "admin" && payload.role !== "principal")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classParam = searchParams.get("class");

    let studentQuery: any = { status: "active" };
    if (classParam && classParam !== "Select Class") {
      studentQuery.classApplying = classParam;
    }

    const students = await Student.find(studentQuery).sort({ classApplying: 1, studentName: 1 });

    const studentsWithStats = await Promise.all(
      students.map(async (student: any) => {
        const totalPresentAllTime = await Attendance.countDocuments({
          studentId: student.studentId,
          status: { $in: ["present", "late"] }
        });

        const totalAbsentAllTime = await Attendance.countDocuments({
          studentId: student.studentId,
          status: "absent"
        });

        const attendancePercentage = TOTAL_WORKING_DAYS > 0 
          ? Math.round((totalPresentAllTime / TOTAL_WORKING_DAYS) * 100) 
          : 0;

        return {
          _id: student._id,
          studentId: student.studentId,
          studentName: student.studentName,
          email: student.email,
          fatherName: student.fatherName,
          classApplying: student.classApplying,
          status: student.status,
          stats: {
            totalWorkingDays: TOTAL_WORKING_DAYS,
            presentDays: totalPresentAllTime,
            absentDays: totalAbsentAllTime,
            attendancePercentage
          }
        };
      })
    );

    return NextResponse.json(studentsWithStats);

  } catch (error) {
    console.error("Admin dashboard attendance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
