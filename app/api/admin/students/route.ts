import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Student from "@/app/models/Student";
import Mark from "@/app/models/Mark";

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
    const academicYearParam = searchParams.get("academicYear");

    let query: any = { status: "active" };
    if (classParam && classParam !== "All Classes") {
      query.classApplying = classParam;
    }

    const students = await Student.find(query).sort({ classApplying: 1, studentName: 1 });

    let marksQuery: any = {};
    if (academicYearParam) {
      marksQuery.academicYear = academicYearParam;
    }

    const studentsWithMarks = await Promise.all(
      students.map(async (student: any) => {
        const marksFilter = { ...marksQuery, studentId: student.studentId };
        const studentMarks = await Mark.find(marksFilter);

        let totalMarks = 0;
        let totalMaxMarks = 0;
        const subjects = [...new Set(studentMarks.map((m: any) => m.subject))];
        const terms = [...new Set(studentMarks.map((m: any) => m.term))];

        studentMarks.forEach((m: any) => {
          totalMarks += m.marks;
          totalMaxMarks += m.maxMarks;
        });

        const totalGradePoints = studentMarks.reduce((sum: number, m: any) => sum + (m.gradePoint || 0), 0);
        const cgpa = studentMarks.length > 0 ? (totalGradePoints / studentMarks.length).toFixed(2) : "0.00";
        const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;

        return {
          _id: student._id,
          studentId: student.studentId,
          studentName: student.studentName,
          email: student.email,
          fatherName: student.fatherName,
          classApplying: student.classApplying,
          status: student.status,
          marksSummary: {
            totalMarks,
            totalMaxMarks,
            percentage,
            cgpa: parseFloat(cgpa),
            examCount: studentMarks.length,
            subjectCount: subjects.length,
            termCount: terms.length
          }
        };
      })
    );

    const classes = [...new Set(students.map((s: any) => s.classApplying))].sort();
    const academicYears = [...new Set(studentsWithMarks.flatMap((s: any) => {
      return s.marksSummary.examCount > 0 ? [] : [];
    }))];

    return NextResponse.json({
      students: studentsWithMarks,
      classes,
      academicYears: ["2025-2026", "2026-2027"]
    });

  } catch (error) {
    console.error("Admin students marks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students marks" },
      { status: 500 }
    );
  }
}
