import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Teacher from "@/app/models/Teacher";
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
    
    if (!payload || payload.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await Teacher.findById(payload.id);
    
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const assignedClasses = teacher.assignedClasses.map((c: any) => c.className);
    const uniqueClasses = [...new Set(assignedClasses)];

    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    
    let query: any = {};
    
    if (uniqueClasses.length === 0) {
      return NextResponse.json({ students: [], classes: [], totalStudents: 0 });
    }
    
    query.classApplying = { $in: uniqueClasses };
    
    if (classFilter && uniqueClasses.includes(classFilter)) {
      query.classApplying = classFilter;
    }
    
    const students = await Student.find(query).sort({ classApplying: 1, studentName: 1 });
    
    const classCounts: Record<string, number> = {};
    for (const cls of uniqueClasses) {
      classCounts[cls as string] = await Student.countDocuments({ classApplying: cls as string });
    }

    return NextResponse.json({
      students,
      classes: uniqueClasses,
      classCounts,
      totalStudents: students.length
    });

  } catch (error) {
    console.error("Teacher students API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
