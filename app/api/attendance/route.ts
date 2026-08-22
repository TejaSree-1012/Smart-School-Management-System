import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Attendance from "@/app/models/Attendance";
import Student from "@/app/models/Student";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const classParam = searchParams.get("class");
    const studentIdParam = searchParams.get("studentId");

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

    if (studentIdParam) {
      query.studentId = studentIdParam;
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1, className: 1, studentName: 1 });

    return NextResponse.json(attendance);

  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
