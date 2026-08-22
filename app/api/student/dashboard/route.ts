import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
import connectDB from "@/app/lib/mongodb";
import Student from "@/app/models/Student";
import Mark from "@/app/models/Mark";
import Attendance from "@/app/models/Attendance";

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await Student.findById(payload.id);
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentId = student.studentId;
    const today = new Date();
    const currentYear = today.getFullYear();
    const academicYear = today.getMonth() >= 4 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`;
    const TOTAL_WORKING_DAYS = 220;

    let attendancePercentage = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let averageMarks = 0;
    let totalMarks = 0;
    let classRank = 0;
    let totalStudents = 0;
    let recentMarks: any[] = [];

    const marks = await Mark.find({ studentId }).sort({ createdAt: -1 }).limit(10);
    totalMarks = marks.length;
    
    if (marks.length > 0) {
      const totalPercentage = marks.reduce((acc, mark) => {
        return acc + (mark.marks / mark.maxMarks) * 100;
      }, 0);
      averageMarks = Math.round(totalPercentage / marks.length);
      
      recentMarks = marks.slice(0, 5).map(mark => ({
        subject: mark.subject,
        marks: mark.marks,
        maxMarks: mark.maxMarks,
        term: mark.term,
        examType: mark.examType,
        academicYear: mark.academicYear
      }));

      const allStudentsInClass = await Mark.aggregate([
        { $match: { academicYear } },
        { $group: { _id: "$studentId", avgPercentage: { $avg: { $multiply: [{ $divide: ["$marks", "$maxMarks"] }, 100] } } } },
        { $sort: { avgPercentage: -1 } }
      ]);

      totalStudents = allStudentsInClass.length;
      const rankIndex = allStudentsInClass.findIndex((s: any) => s._id === studentId);
      if (rankIndex !== -1) {
        classRank = rankIndex + 1;
      }
    }

    const attendanceRecords = await Attendance.find({ studentId });
    
    if (attendanceRecords.length > 0) {
      totalPresent = attendanceRecords.filter(a => a.status === "present" || a.status === "late").length;
      totalAbsent = attendanceRecords.filter(a => a.status === "absent").length;
      attendancePercentage = Math.round((totalPresent / TOTAL_WORKING_DAYS) * 100);
    }

    return NextResponse.json({
      attendancePercentage,
      totalPresent,
      totalAbsent,
      totalMarks,
      averageMarks,
      classRank,
      totalStudents,
      recentMarks
    });
  } catch (error) {
    console.error("STUDENT DASHBOARD API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}