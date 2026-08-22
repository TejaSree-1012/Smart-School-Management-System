import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Attendance from "@/app/models/Attendance";
import Student from "@/app/models/Student";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let query: Record<string, unknown> = {};
    
    if (studentId) {
      query.studentId = studentId;
    }
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === "present").length;
    const absentDays = attendance.filter(a => a.status === "absent").length;
    const lateDays = attendance.filter(a => a.status === "late").length;
    
    const attendancePercentage = totalDays > 0 
      ? Math.round((presentDays / totalDays) * 100) 
      : 0;

    return NextResponse.json({
      records: attendance,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage
      }
    });
  } catch (error) {
    console.error("ATTENDANCE API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { studentId, date, status, period, subject, remarks } = body;

    if (!studentId || !date || !status) {
      return NextResponse.json(
        { message: "Student ID, date, and status are required" },
        { status: 400 }
      );
    }

    const existingRecord = await Attendance.findOne({
      studentId,
      date: new Date(date)
    });

    if (existingRecord) {
      existingRecord.status = status;
      if (period) existingRecord.period = period;
      if (subject) existingRecord.subject = subject;
      if (remarks) existingRecord.remarks = remarks;
      await existingRecord.save();
      return NextResponse.json(existingRecord, { status: 200 });
    }

    const newAttendance = new Attendance({
      studentId,
      date: new Date(date),
      status,
      period,
      subject,
      remarks
    });

    await newAttendance.save();
    return NextResponse.json(newAttendance, { status: 201 });
  } catch (error: any) {
    console.error("CREATE ATTENDANCE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create attendance" },
      { status: 500 }
    );
  }
}
