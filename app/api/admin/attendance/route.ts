import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Attendance from "@/app/models/Attendance";
import Student from "@/app/models/Student";

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
    const dateParam = searchParams.get("date");
    const classParam = searchParams.get("class");
    const mode = searchParams.get("mode");

    if (mode === "overview") {
      const today = dateParam ? new Date(dateParam) : new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const attendance = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const allStudents = await Student.find({ status: "active" });
      const classes = [...new Set(allStudents.map((s: any) => s.classApplying))];

      const classWiseStats: Record<string, any> = {};
      const totalStudents = allStudents.length;
      let totalPresent = 0;
      let totalAbsent = 0;
      let markedCount = 0;

      for (const cls of classes) {
        const classStudents = allStudents.filter((s: any) => s.classApplying === cls);
        const classAttendance = attendance.filter((a: any) => a.className === cls);
        
        const presentInClass = classAttendance.filter((a: any) => a.status === "present" || a.status === "late").length;
        const absentInClass = classAttendance.filter((a: any) => a.status === "absent").length;
        const markedInClass = classAttendance.length;
        
        classWiseStats[cls as string] = {
          totalStudents: classStudents.length,
          present: presentInClass,
          absent: absentInClass,
          notMarked: classStudents.length - markedInClass,
          marked: markedInClass > 0,
          percentage: markedInClass > 0 ? Math.round((presentInClass / classStudents.length) * 100) : 0
        };
        
        totalPresent += presentInClass;
        totalAbsent += absentInClass;
        if (markedInClass > 0) markedCount++;
      }

      return NextResponse.json({
        date: dateParam || new Date().toISOString().split('T')[0],
        classes: classes,
        classWiseStats,
        summary: {
          totalClasses: classes.length,
          totalStudents,
          totalPresent,
          totalAbsent,
          markedClasses: markedCount,
          attendancePercentage: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0
        }
      });
    }

    const query: any = {};

    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (classParam) {
      query.className = classParam;
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1, className: 1, studentName: 1 });

    const summary = {
      totalRecords: attendance.length,
      present: attendance.filter((a: any) => a.status === "present" || a.status === "late").length,
      absent: attendance.filter((a: any) => a.status === "absent").length,
      late: attendance.filter((a: any) => a.status === "late").length
    };

    const classes = [...new Set(attendance.map((a: any) => a.className))];

    const classWiseStats: Record<string, any> = {};
    for (const cls of classes) {
      const classAttendance = attendance.filter((a: any) => a.className === cls);
      classWiseStats[cls as string] = {
        total: classAttendance.length,
        present: classAttendance.filter((a: any) => a.status === "present" || a.status === "late").length,
        absent: classAttendance.filter((a: any) => a.status === "absent").length,
        late: classAttendance.filter((a: any) => a.status === "late").length
      };
    }

    return NextResponse.json({
      attendance,
      summary,
      classes,
      classWiseStats,
      filters: { date: dateParam, class: classParam }
    });

  } catch (error) {
    console.error("Admin attendance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
