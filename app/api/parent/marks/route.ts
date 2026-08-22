import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
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

    const payload = await verifyToken(token);
    
    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const termParam = searchParams.get("term");
    const academicYearParam = searchParams.get("academicYear");
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    const student = await Student.findOne({ studentId: new RegExp(`^${studentId}$`, 'i') });
    
    if (!student) {
      console.log("Student not found for ID:", studentId);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Use exact studentId from found student (using same format as stored in DB)
    const queryStudentId = student.studentId;
    console.log("Parent marks - Using studentId:", queryStudentId);

    let query: any = { studentId: queryStudentId };

    if (termParam) {
      query.term = termParam;
    }

    if (academicYearParam) {
      query.academicYear = academicYearParam;
    }

    const marks = await Mark.find(query).sort({ term: 1, examType: 1, subject: 1 });
    console.log("Parent marks - Found:", marks.length, "records");

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
        const term = mark.term;
        
        if (!termWiseData[term]) {
          termWiseData[term] = {
            term,
            exams: []
          };
        }
        
        termWiseData[term].exams.push({
          examType: mark.examType,
          marks: mark.marks,
          maxMarks: mark.maxMarks,
          grade: mark.grade || "",
          gradePoint: mark.gradePoint || 0,
          percentage: Math.round((mark.marks / mark.maxMarks) * 100)
        });
        
        totalMarks += mark.marks;
        totalMaxMarks += mark.maxMarks;
        examCount++;
      }
      
      termWiseData[term].totalMarks = termWiseData[term].exams.reduce((acc: number, e: any) => acc + e.marks, 0);
      termWiseData[term].totalMaxMarks = termWiseData[term].exams.reduce((acc: number, e: any) => acc + e.maxMarks, 0);
      termWiseData[term].percentage = Math.round((termWiseData[term].totalMarks / termWiseData[term].totalMaxMarks) * 100);
      
      subjectWiseData[subject] = {
        subject,
        termWise: termWiseData,
        overall: {
          totalMarks,
          totalMaxMarks,
          percentage: Math.round((totalMarks / totalMaxMarks) * 100),
          examCount
        }
      };
    }

    let overallTotalMarks = 0;
    let overallTotalMaxMarks = 0;
    let totalExams = 0;
    
    for (const mark of marks) {
      overallTotalMarks += mark.marks;
      overallTotalMaxMarks += mark.maxMarks;
      totalExams++;
    }

    const overallPercentage = overallTotalMaxMarks > 0 
      ? Math.round((overallTotalMarks / overallTotalMaxMarks) * 100) 
      : 0;

    const cgpa = overallPercentage >= 90 ? 10 : 
               overallPercentage >= 80 ? 9 : 
               overallPercentage >= 70 ? 8 : 
               overallPercentage >= 60 ? 7 : 
               overallPercentage >= 50 ? 6 : 
               overallPercentage >= 40 ? 5 : 0;

    const grade = overallPercentage >= 90 ? "A+" :
                 overallPercentage >= 80 ? "A" :
                 overallPercentage >= 70 ? "B+" :
                 overallPercentage >= 60 ? "B" :
                 overallPercentage >= 50 ? "C" :
                 overallPercentage >= 40 ? "D" : "F";

    const summary = {
      overallTotalMarks,
      overallTotalMaxMarks,
      overallPercentage,
      totalExams,
      totalSubjects: subjects.length,
      cgpa,
      grade
    };

    const termSummary: Record<string, any> = {};
    for (const term of terms) {
      const termMarks = marks.filter(m => m.term === term);
      let termTotal = 0;
      let termMax = 0;
      
      for (const mark of termMarks) {
        termTotal += mark.marks;
        termMax += mark.maxMarks;
      }
      
      termSummary[term] = {
        totalMarks: termTotal,
        totalMaxMarks: termMax,
        percentage: termMax > 0 ? Math.round((termTotal / termMax) * 100) : 0,
        examCount: termMarks.length,
        subjectCount: [...new Set(termMarks.map(m => m.subject))].length
      };
    }

    return NextResponse.json({
      student: {
        studentId: student.studentId,
        name: student.studentName,
        class: student.classApplying
      },
      summary,
      termSummary,
      subjectWiseData,
      subjects,
      terms,
      academicYears
    });
  } catch (error) {
    console.error("PARENT MARKS API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch marks" },
      { status: 500 }
    );
  }
}