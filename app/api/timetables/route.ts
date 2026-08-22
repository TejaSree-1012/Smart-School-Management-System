import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Timetable from "@/app/models/Timetable";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const dayOfWeekParam = searchParams.get("dayOfWeek");
    const teacherName = searchParams.get("teacherName");

    const query: Record<string, string | number> = {};

    if (className && className.trim() !== "") {
      query.className = className;
    }

    if (dayOfWeekParam !== null && dayOfWeekParam !== undefined && dayOfWeekParam !== "") {
      const dayNum = parseInt(dayOfWeekParam, 10);
      if (!isNaN(dayNum)) {
        query.dayOfWeek = dayNum;
      }
    }

    let timetables = await Timetable.find(query).sort({ dayOfWeek: 1 }).lean();

    if (teacherName && teacherName.trim() !== "") {
      timetables = timetables.filter((t: any) =>
        t.periods.some((p: any) => p.teacherName === teacherName.trim())
      );
    }

    return NextResponse.json(timetables);
  } catch (error) {
    console.error("TIMETABLE GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch timetable", error: "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();
    const body = await request.json();

    const { className, dayOfWeek, periods, academicYear } = body;

    if (!className || className.trim() === "") {
      return NextResponse.json({ message: "Class name is required" }, { status: 400 });
    }

    if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek === "") {
      return NextResponse.json({ message: "Day of week is required" }, { status: 400 });
    }

    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return NextResponse.json({ message: "At least one period is required" }, { status: 400 });
    }

    if (!academicYear || academicYear.trim() === "") {
      return NextResponse.json({ message: "Academic year is required" }, { status: 400 });
    }

    const dayNum = parseInt(String(dayOfWeek), 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 6) {
      return NextResponse.json(
        { message: "Day of week must be between 1 (Monday) and 6 (Saturday)" },
        { status: 400 }
      );
    }

    const existingTimetable = await Timetable.findOne({
      className: className.trim(),
      dayOfWeek: dayNum,
      academicYear: academicYear.trim()
    });

    if (existingTimetable) {
      existingTimetable.periods = periods;
      await existingTimetable.save();
      return NextResponse.json(existingTimetable, { status: 200 });
    }

    const newTimetable = new Timetable({
      className: className.trim(),
      dayOfWeek: dayNum,
      periods: periods,
      academicYear: academicYear.trim(),
      term: "Full Year",
      createdBy: auth.user.id
    });

    await newTimetable.save();
    return NextResponse.json(newTimetable, { status: 201 });
  } catch (error) {
    console.error("TIMETABLE POST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save timetable", error: "Database error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();
    const body = await request.json();
    const { id, className, dayOfWeek, periods, academicYear, term } = body;

    if (!id || id.trim() === "") {
      return NextResponse.json({ message: "Timetable ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (className !== undefined) updateData.className = className.trim();
    if (dayOfWeek !== undefined) updateData.dayOfWeek = parseInt(String(dayOfWeek), 10);
    if (periods !== undefined) updateData.periods = periods;
    if (academicYear !== undefined) updateData.academicYear = academicYear.trim();
    if (term !== undefined) updateData.term = term;

    const timetable = await Timetable.findByIdAndUpdate(
      id.trim(),
      updateData,
      { new: true, runValidators: true }
    );

    if (!timetable) {
      return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
    }

    return NextResponse.json(timetable);
  } catch (error) {
    console.error("TIMETABLE PUT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update timetable", error: "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || id.trim() === "") {
      return NextResponse.json({ message: "Timetable ID is required" }, { status: 400 });
    }

    const timetable = await Timetable.findByIdAndDelete(id.trim());

    if (!timetable) {
      return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("TIMETABLE DELETE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete timetable", error: "Database error" },
      { status: 500 }
    );
  }
}
