import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Teacher from "@/app/models/Teacher";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const subject = searchParams.get("subject");

    if (!className) {
      return NextResponse.json({ teachers: [] });
    }

    const allTeachers = await Teacher.find({ isActive: { $ne: false } }).lean();

    const matching = allTeachers.filter((t: any) => {
      const assignments = t.assignedClasses || [];
      if (subject && subject.trim() !== "") {
        return assignments.some(
          (a: any) =>
            a.className === className &&
            a.subject.toLowerCase().trim() === subject.toLowerCase().trim()
        );
      }
      return assignments.some((a: any) => a.className === className);
    });

    const teachers = matching.map((t: any) => ({
      _id: t._id,
      name: t.name,
      email: t.email
    }));

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Teachers by assignment error:", error);
    return NextResponse.json({ teachers: [] }, { status: 500 });
  }
}
