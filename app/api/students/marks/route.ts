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
    
    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await Student.findById(payload.id);
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const termParam = searchParams.get("term");
    const academicYearParam = searchParams.get("academicYear");

    let query: any = { studentId: student.studentId };

    if (termParam) {
      query.term = termParam;
    }

    if (academicYearParam) {
      query.academicYear = academicYearParam;
    }

    const marks = await Mark.find(query).sort({ term: 1, examType: 1, subject: 1 });

    const subjects = [...new Set(marks.map(m => m.subject))];
    const terms = [...new Set(marks.map(m => m.term))];
    const academicYears = [...new Set(marks.map(m => m.academicYear))];

    const subjectWiseData: Record<string, any> = {};
    for (const subject of subjects) {
      const subjectMarks = marks.filter(m => m.subject === subject);
      
      let totalMarks = 0;
      let totalMaxMarks = 0;
      let examCount = 0;
      
      const termWiseData: Record<string, any> = {};
      
      for (const mark of subjectMarks) {
        if (!termWiseData[mark.term]) {
          termWiseData[mark.term] = {
            term: mark.term,
            exams: [],
            totalMarks: 0,
            totalMaxMarks: 0
          };
        }
        
        termWiseData[mark.term].exams.push({
          examType: mark.examType,
          marks: mark.marks,
          maxMarks: mark.maxMarks,
          grade: mark.grade,
          gradePoint: mark.gradePoint,
          percentage: Math.round((mark.marks / mark.maxMarks) * 100)
        });
        
        termWiseData[mark.term].totalMarks += mark.marks;
        termWiseData[mark.term].totalMaxMarks += mark.maxMarks;
        
        totalMarks += mark.marks;
        totalMaxMarks += mark.maxMarks;
        examCount++;
      }
      
      for (const term in termWiseData) {
        termWiseData[term].percentage = Math.round((termWiseData[term].totalMarks / termWiseData[term].totalMaxMarks) * 100);
      }
      
      subjectWiseData[subject] = {
        subject,
        termWise: termWiseData,
        overall: {
          totalMarks,
          totalMaxMarks,
          percentage: totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0,
          examCount
        }
      };
    }

    const termWiseSummary: Record<string, any> = {};
    for (const term of terms) {
      const termMarks = marks.filter(m => m.term === term);
      const totalMarks = termMarks.reduce((sum, m) => sum + m.marks, 0);
      const totalMaxMarks = termMarks.reduce((sum, m) => sum + m.maxMarks, 0);
      
      termWiseSummary[term] = {
        totalMarks,
        totalMaxMarks,
        percentage: totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0,
        examCount: termMarks.length,
        subjectCount: [...new Set(termMarks.map(m => m.subject))].length
      };
    }

    const overallTotalMarks = marks.reduce((sum, m) => sum + m.marks, 0);
    const overallTotalMaxMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);

    const totalGradePoints = marks.reduce((sum, m) => sum + (m.gradePoint || 0), 0);
    const cgpa = marks.length > 0 ? (totalGradePoints / marks.length).toFixed(2) : "0.00";

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        name: student.studentName,
        class: student.classApplying
      },
      summary: {
        overallTotalMarks,
        overallTotalMaxMarks,
        overallPercentage: overallTotalMaxMarks > 0 ? Math.round((overallTotalMarks / overallTotalMaxMarks) * 100) : 0,
        totalExams: marks.length,
        totalSubjects: subjects.length,
        cgpa: parseFloat(cgpa),
        grade: getOverallGrade(parseFloat(cgpa))
      },
      termWiseSummary,
      subjectWiseData,
      subjects,
      terms,
      academicYears,
      recentMarks: marks.slice(-10).reverse()
    });

  } catch (error) {
    console.error("Student marks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marks" },
      { status: 500 }
    );
  }
}

function getOverallGrade(cgpa: number): string {
  if (cgpa >= 9.5) return "A1 - Outstanding";
  if (cgpa >= 8.5) return "A2 - Excellent";
  if (cgpa >= 7.5) return "B1 - Very Good";
  if (cgpa >= 6.5) return "B2 - Good";
  if (cgpa >= 5.5) return "C1 - Fair";
  if (cgpa >= 4.5) return "C2 - Satisfactory";
  if (cgpa >= 3.5) return "D - Pass";
  return "E - Needs Improvement";
}
