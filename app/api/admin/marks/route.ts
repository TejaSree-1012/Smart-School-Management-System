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
    const academicYearParam = searchParams.get("academicYear");
    const termParam = searchParams.get("term");

    let marksQuery: any = {};
    if (academicYearParam) {
      marksQuery.academicYear = academicYearParam;
    }
    if (termParam) {
      marksQuery.term = termParam;
    }

    const allMarks = await Mark.find(marksQuery);
    const allStudents = await Student.find({ status: "active" });

    const studentIdsWithMarks = new Set(allMarks.map((m: any) => m.studentId));
    const studentsMap = new Map(allStudents.map((s: any) => [s.studentId, s]));

    const classWiseStats: Record<string, any> = {};
    const subjectStats: Record<string, any> = {};
    let totalSchoolMarks = 0;
    let totalSchoolMaxMarks = 0;
    let totalExams = 0;
    let totalStudentsWithMarks = 0;
    const gradeDistribution: Record<string, number> = {
      "A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0, "D": 0, "E": 0
    };

    for (const mark of allMarks) {
      const student = studentsMap.get(mark.studentId);
      const className = student?.classApplying || "Unassigned";

      if (!classWiseStats[className]) {
        classWiseStats[className] = {
          className,
          totalStudents: 0,
          studentsWithMarks: new Set(),
          totalMarks: 0,
          totalMaxMarks: 0,
          totalGradePoints: 0,
          examsCount: 0,
          subjectSet: new Set(),
          termSet: new Set(),
          studentMarks: {}
        };
      }

      if (!classWiseStats[className].studentMarks[mark.studentId]) {
        classWiseStats[className].studentMarks[mark.studentId] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          totalGradePoints: 0,
          examCount: 0
        };
        classWiseStats[className].studentsWithMarks.add(mark.studentId);
      }

      const studentData = classWiseStats[className].studentMarks[mark.studentId];
      studentData.totalMarks += mark.marks;
      studentData.totalMaxMarks += mark.maxMarks;
      studentData.totalGradePoints += (mark.gradePoint || 0);
      studentData.examCount += 1;

      classWiseStats[className].totalMarks += mark.marks;
      classWiseStats[className].totalMaxMarks += mark.maxMarks;
      classWiseStats[className].totalGradePoints += (mark.gradePoint || 0);
      classWiseStats[className].examsCount += 1;
      classWiseStats[className].subjectSet.add(mark.subject);
      classWiseStats[className].termSet.add(mark.term);

      if (mark.grade && gradeDistribution.hasOwnProperty(mark.grade)) {
        gradeDistribution[mark.grade] += 1;
      }

      if (!subjectStats[mark.subject]) {
        subjectStats[mark.subject] = {
          subject: mark.subject,
          totalMarks: 0,
          totalMaxMarks: 0,
          examCount: 0,
          studentCount: new Set()
        };
      }
      subjectStats[mark.subject].totalMarks += mark.marks;
      subjectStats[mark.subject].totalMaxMarks += mark.maxMarks;
      subjectStats[mark.subject].examCount += 1;
      subjectStats[mark.subject].studentCount.add(mark.studentId);

      totalSchoolMarks += mark.marks;
      totalSchoolMaxMarks += mark.maxMarks;
      totalExams += 1;
    }

    for (const student of allStudents) {
      const className = student.classApplying || "Unassigned";
      if (!classWiseStats[className]) {
        classWiseStats[className] = {
          className,
          totalStudents: 0,
          studentsWithMarks: new Set(),
          totalMarks: 0,
          totalMaxMarks: 0,
          totalGradePoints: 0,
          examsCount: 0,
          subjectSet: new Set(),
          termSet: new Set(),
          studentMarks: {}
        };
      }
      classWiseStats[className].totalStudents += 1;
    }

    totalStudentsWithMarks = studentIdsWithMarks.size;
    const schoolAverage = totalSchoolMaxMarks > 0 ? Math.round((totalSchoolMarks / totalSchoolMaxMarks) * 100) : 0;
    const schoolCgpa = totalExams > 0 ? ((allMarks.reduce((sum: number, m: any) => sum + (m.gradePoint || 0), 0)) / totalExams).toFixed(2) : "0.00";

    const classStatsArray = Object.values(classWiseStats).map((stats: any) => {
      const studentCount = stats.studentsWithMarks.size;
      const avgPercentage = stats.totalMaxMarks > 0 ? Math.round((stats.totalMarks / stats.totalMaxMarks) * 100) : 0;
      const avgCgpa = stats.examsCount > 0 ? (stats.totalGradePoints / stats.examsCount).toFixed(2) : "0.00";
      const passCount = Object.values(stats.studentMarks).filter((s: any) => {
        const pct = s.totalMaxMarks > 0 ? (s.totalMarks / s.totalMaxMarks) * 100 : 0;
        return pct >= 33;
      }).length;

      return {
        className: stats.className,
        totalStudents: stats.totalStudents,
        studentsWithMarks: studentCount,
        averagePercentage: avgPercentage,
        averageCgpa: parseFloat(avgCgpa),
        totalExams: stats.examsCount,
        subjectCount: stats.subjectSet.size,
        termCount: stats.termSet.size,
        passCount,
        passRate: studentCount > 0 ? Math.round((passCount / studentCount) * 100) : 0,
        totalMarks: stats.totalMarks,
        totalMaxMarks: stats.totalMaxMarks
      };
    }).sort((a, b) => {
      const aNum = parseInt(a.className.replace(/[^0-9]/g, "") || "0");
      const bNum = parseInt(b.className.replace(/[^0-9]/g, "") || "0");
      if (a.className.includes("Nursery")) return -1;
      if (b.className.includes("Nursery")) return 1;
      if (a.className.includes("LKG")) return -1;
      if (b.className.includes("LKG")) return 1;
      if (a.className.includes("UKG")) return -1;
      if (b.className.includes("UKG")) return 1;
      return aNum - bNum;
    });

    const subjectStatsArray = Object.values(subjectStats).map((stats: any) => ({
      subject: stats.subject,
      averagePercentage: stats.totalMaxMarks > 0 ? Math.round((stats.totalMarks / stats.totalMaxMarks) * 100) : 0,
      totalExams: stats.examCount,
      studentCount: stats.studentCount.size,
      totalMarks: stats.totalMarks,
      totalMaxMarks: stats.totalMaxMarks
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    return NextResponse.json({
      schoolStats: {
        totalStudents: allStudents.length,
        studentsWithMarks: totalStudentsWithMarks,
        totalExams,
        averagePercentage: schoolAverage,
        averageCgpa: parseFloat(schoolCgpa),
        gradeDistribution
      },
      classStats: classStatsArray,
      subjectStats: subjectStatsArray,
      academicYears: ["2025-2026", "2026-2027"],
      terms: ["Term 1", "Term 2", "Term 3"]
    });

  } catch (error) {
    console.error("Admin class marks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch class marks data" },
      { status: 500 }
    );
  }
}
