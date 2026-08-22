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
    const studentIdParam = searchParams.get("studentId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (!studentIdParam) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const student = await Student.findOne({ studentId: studentIdParam });
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const today = new Date();
    const month = monthParam !== null ? parseInt(monthParam) : today.getMonth();
    const year = yearParam !== null ? parseInt(yearParam) : today.getFullYear();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const attendance = await Attendance.find({
      studentId: student.studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const totalRecords = attendance.length;
    const monthlyPresentDays = attendance.filter((a: any) => a.status === "present" || a.status === "late").length;
    const monthlyAbsentDays = attendance.filter((a: any) => a.status === "absent").length;

    const totalPresentAllTime = await Attendance.countDocuments({
      studentId: student.studentId,
      status: { $in: ["present", "late"] }
    });

    const totalAbsentAllTime = await Attendance.countDocuments({
      studentId: student.studentId,
      status: "absent"
    });

    const totalMarked = totalPresentAllTime + totalAbsentAllTime;
    const attendancePercentage = TOTAL_WORKING_DAYS > 0 
      ? Math.round((totalPresentAllTime / TOTAL_WORKING_DAYS) * 100) 
      : 0;

    const attendanceByDate: Record<string, any> = {};
    const absentDates: string[] = [];
    
    attendance.forEach((a: any) => {
      const dateKey = new Date(a.date).toISOString().split('T')[0];
      attendanceByDate[dateKey] = a;
      if (a.status === "absent") {
        absentDates.push(dateKey);
      }
    });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        name: student.studentName,
        class: student.classApplying
      },
      stats: {
        totalWorkingDays: TOTAL_WORKING_DAYS,
        presentDays: totalPresentAllTime,
        absentDays: totalAbsentAllTime,
        markedDays: totalMarked,
        attendancePercentage
      },
      monthlyStats: {
        month,
        year,
        monthName: monthNames[month],
        daysInMonth,
        firstDayOfMonth,
        presentDays: monthlyPresentDays,
        absentDays: monthlyAbsentDays,
        totalRecords
      },
      absentDates,
      attendance: attendanceByDate,
      records: attendance
    });

  } catch (error) {
    console.error("Admin student attendance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
