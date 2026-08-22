import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Teacher from "@/app/models/Teacher";
import Student from "@/app/models/Student";
import Attendance from "@/app/models/Attendance";

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
    
    if (!payload || payload.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await Teacher.findById(payload.id);
    
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("class");
    const dateParam = searchParams.get("date");
    const mode = searchParams.get("mode");

    const assignedClasses = teacher.assignedClasses.map((c: any) => c.className);
    const uniqueClasses = [...new Set(assignedClasses)];

    if (mode === "history") {
      const date = dateParam ? new Date(dateParam) : new Date();
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const query: any = {
        date: { $gte: startOfDay, $lte: endOfDay }
      };

      if (className && uniqueClasses.includes(className)) {
        query.className = className;
      } else {
        query.className = { $in: uniqueClasses };
      }

      const attendance = await Attendance.find(query).sort({ className: 1, studentName: 1 });
      
      const classStats: Record<string, { present: number; absent: number; total: number }> = {};
      for (const cls of uniqueClasses) {
        const clsName = cls as string;
        const clsAttendances = attendance.filter((a: any) => a.className === clsName);
        classStats[clsName] = {
          present: clsAttendances.filter((a: any) => a.status === "present" || a.status === "late").length,
          absent: clsAttendances.filter((a: any) => a.status === "absent").length,
          total: clsAttendances.length
        };
      }

      return NextResponse.json({
        attendance,
        classes: uniqueClasses,
        classStats,
        date: dateParam || new Date().toISOString().split('T')[0]
      });
    }

    if (mode === "stats") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const classStats: Record<string, { present: number; absent: number; total: number }> = {};
      
      for (const cls of uniqueClasses) {
        const clsName = cls as string;
        const students = await Student.find({ classApplying: clsName, status: "active" });
        const marked = await Attendance.find({ 
          className: clsName, 
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        classStats[clsName] = {
          present: marked.filter((a: any) => a.status === "present" || a.status === "late").length,
          absent: marked.filter((a: any) => a.status === "absent").length,
          total: students.length
        };
      }

      const totalStudents = Object.values(classStats).reduce((sum, s) => sum + s.total, 0);
      const totalPresent = Object.values(classStats).reduce((sum, s) => sum + s.present, 0);
      const totalAbsent = Object.values(classStats).reduce((sum, s) => sum + s.absent, 0);

      return NextResponse.json({
        classes: uniqueClasses,
        classStats,
        summary: {
          totalStudents,
          totalPresent,
          totalAbsent,
          markedToday: totalPresent + totalAbsent
        }
      });
    }

    if (className) {
      if (!uniqueClasses.includes(className)) {
        return NextResponse.json({ error: "Not authorized for this class" }, { status: 403 });
      }

      const students = await Student.find({ 
        classApplying: className,
        status: "active"
      }).sort({ studentName: 1 });

      const date = dateParam ? new Date(dateParam) : new Date();
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const existingAttendance = await Attendance.find({
        className,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const studentsWithAttendance = students.map(s => {
        const record = existingAttendance.find((a: any) => a.studentId === s.studentId);
        return {
          ...s.toObject(),
          attendanceStatus: record?.status || null,
          attendanceId: record?._id || null
        };
      });

      return NextResponse.json({
        students: studentsWithAttendance,
        className,
        date: dateParam || new Date().toISOString().split('T')[0],
        alreadyMarked: existingAttendance.length > 0
      });
    }

    return NextResponse.json({
      classes: uniqueClasses,
      message: "Please provide a class parameter to fetch students"
    });

  } catch (error) {
    console.error("Teacher attendance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verifyToken } = await import("@/app/lib/jwt");
    const payload = await verifyToken(token);
    
    if (!payload || payload.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await Teacher.findById(payload.id);
    
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await request.json();
    const { attendanceRecords, date, className } = body;

    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json({ error: "Attendance records are required" }, { status: 400 });
    }

    const assignedClasses = teacher.assignedClasses.map((c: any) => c.className);
    if (!assignedClasses.includes(className)) {
      return NextResponse.json({ error: "Not authorized for this class" }, { status: 403 });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    await Attendance.deleteMany({
      className,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const recordsToInsert = attendanceRecords.map((record: any) => ({
      studentId: record.studentId,
      studentName: record.studentName,
      className,
      date: attendanceDate,
      status: record.status,
      period: record.period || 0,
      subject: record.subject || "General",
      markedBy: teacher._id,
      teacherName: teacher.name,
      academicYear: "2025-2026"
    }));

    await Attendance.insertMany(recordsToInsert);

    const absentees = attendanceRecords.filter((r: any) => r.status === "absent");

    return NextResponse.json({
      success: true,
      message: `Attendance marked successfully for ${attendanceRecords.length} students`,
      absentees,
      absenteesCount: absentees.length
    });

  } catch (error) {
    console.error("Teacher attendance POST error:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
