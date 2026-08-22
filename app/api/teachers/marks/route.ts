import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Teacher from "@/app/models/Teacher";
import Student from "@/app/models/Student";
import Mark from "@/app/models/Mark";

const EXAM_TYPES = [
  "Periodic Test 1",
  "Periodic Test 2", 
  "Periodic Test 3",
  "Half Yearly Exam",
  "Annual Exam",
  "Unit Test 1",
  "Unit Test 2",
  "Unit Test 3",
  "Subject Enrichment",
  "Portfolio",
  "Multiple Assessment",
  "Quiz"
];

const TERMS = ["Term 1", "Term 2", "Term 3"];

const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

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

    const assignedClasses = teacher.assignedClasses || [];
    const uniqueClasses = [...new Set(assignedClasses.map((c: any) => c.className))];

    const { searchParams } = new URL(request.url);
    const classParam = searchParams.get("class");
    const subjectParam = searchParams.get("subject");
    const termParam = searchParams.get("term");
    const examTypeParam = searchParams.get("examType");
    const academicYearParam = searchParams.get("academicYear");
    const mode = searchParams.get("mode");

    if (mode === "subjects") {
      const subjects = [...new Set(assignedClasses.map((c: any) => c.subject))];
      return NextResponse.json({ subjects });
    }

    if (mode === "existing") {
      const query: any = {};
      
      if (classParam) {
        query.className = classParam;
      } else {
        query.className = { $in: uniqueClasses };
      }

      if (subjectParam) {
        query.subject = subjectParam;
      }

      if (termParam) {
        query.term = termParam;
      }

      if (examTypeParam) {
        query.examType = examTypeParam;
      }

      if (academicYearParam) {
        query.academicYear = academicYearParam;
      }

      const marks = await Mark.find(query).sort({ createdAt: -1 });
      return NextResponse.json({ marks });
    }

    let students: any[] = [];
    
    if (classParam) {
      if (!uniqueClasses.includes(classParam)) {
        return NextResponse.json({ error: "Not authorized for this class" }, { status: 403 });
      }
      
      const classSubjects = assignedClasses
        .filter((c: any) => c.className === classParam)
        .map((c: any) => c.subject);
      
      students = await Student.find({ 
        classApplying: classParam,
        status: "active" 
      }).sort({ studentName: 1 });

      students = students.map(s => ({
        ...s.toObject(),
        teachingSubjects: classSubjects
      }));
    } else {
      students = await Student.find({ 
        classApplying: { $in: uniqueClasses },
        status: "active" 
      }).sort({ classApplying: 1, studentName: 1 });
    }

    const teacherSubjects = [...new Set(assignedClasses.map((c: any) => c.subject))];

    return NextResponse.json({
      students,
      classes: uniqueClasses,
      subjects: teacherSubjects,
      examTypes: EXAM_TYPES,
      terms: TERMS,
      academicYears: ACADEMIC_YEARS
    });

  } catch (error) {
    console.error("Teacher marks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
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
    const { marksRecords } = body;

    if (!marksRecords || !Array.isArray(marksRecords) || marksRecords.length === 0) {
      return NextResponse.json({ error: "Marks records are required" }, { status: 400 });
    }

    const teacherSubjects = teacher.assignedClasses.map((c: any) => c.subject);
    
    for (const record of marksRecords) {
      if (!teacherSubjects.includes(record.subject)) {
        return NextResponse.json({ 
          error: `You are not authorized to mark for subject: ${record.subject}` 
        }, { status: 403 });
      }
    }

    const savedMarks: any[] = [];
    const errors: any[] = [];

    for (const record of marksRecords) {
      try {
        const percentage = (record.marks / record.maxMarks) * 100;
        const { grade, gradePoint } = calculateGrade(percentage);

        await Mark.findOneAndUpdate(
          {
            studentId: record.studentId,
            subject: record.subject,
            examType: record.examType,
            term: record.term,
            academicYear: record.academicYear
          },
          {
            studentId: record.studentId,
            studentName: record.studentName,
            className: record.className,
            subject: record.subject,
            examType: record.examType,
            term: record.term,
            academicYear: record.academicYear,
            marks: record.marks,
            maxMarks: record.maxMarks,
            grade,
            gradePoint,
            markedBy: teacher._id,
            teacherName: teacher.name,
            remarks: record.remarks || ""
          },
          { upsert: true, new: true }
        );

        savedMarks.push({
          studentId: record.studentId,
          studentName: record.studentName,
          subject: record.subject,
          marks: record.marks,
          maxMarks: record.maxMarks,
          grade,
          gradePoint
        });
      } catch (err: any) {
        errors.push({
          studentId: record.studentId,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Marks saved successfully for ${savedMarks.length} students`,
      savedMarks,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Teacher marks POST error:", error);
    return NextResponse.json(
      { error: "Failed to save marks" },
      { status: 500 }
    );
  }
}

function calculateGrade(percentage: number): { grade: string; gradePoint: number } {
  if (percentage >= 91) return { grade: "A1", gradePoint: 10 };
  if (percentage >= 81) return { grade: "A2", gradePoint: 9 };
  if (percentage >= 71) return { grade: "B1", gradePoint: 8 };
  if (percentage >= 61) return { grade: "B2", gradePoint: 7 };
  if (percentage >= 51) return { grade: "C1", gradePoint: 6 };
  if (percentage >= 41) return { grade: "C2", gradePoint: 5 };
  if (percentage >= 33) return { grade: "D", gradePoint: 4 };
  return { grade: "E", gradePoint: 0 };
}
