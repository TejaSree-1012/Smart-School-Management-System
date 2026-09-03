import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Timetable from "@/app/models/Timetable";
import { requireAdmin } from "@/app/lib/auth";

async function findScheduleConflicts(
  className: string,
  dayOfWeek: number,
  academicYear: string,
  periods: any[],
  excludeTimetableId?: string
): Promise<string[]> {
  const conflicts: string[] = [];

  const teachingPeriods = periods.filter(
    (p: any) => !p.isBreak && p.periodNumber !== undefined
  );

  if (teachingPeriods.length === 0) {
    return conflicts;
  }

  const query: Record<string, unknown> = {
    dayOfWeek,
    academicYear,
    className: { $ne: className }
  };

  if (excludeTimetableId) {
    query._id = { $ne: excludeTimetableId };
  }

  const otherTimetables = await Timetable.find(query).lean();

  for (const period of teachingPeriods) {
    const hasTeacher = period.teacherName && period.teacherName.trim() !== "" && period.teacherName !== "TBA";
    const hasRoom = period.roomNumber && period.roomNumber.trim() !== "";

    for (const other of otherTimetables as any[]) {
      const otherPeriod = (other.periods || []).find(
        (p: any) => !p.isBreak && p.periodNumber === period.periodNumber
      );

      if (!otherPeriod) continue;

      if (hasTeacher && otherPeriod.teacherName === period.teacherName) {
        conflicts.push(
          `${period.teacherName} is already teaching ${other.className} at Period ${period.periodNumber} on this day`
        );
      }

      if (hasRoom && otherPeriod.roomNumber && otherPeriod.roomNumber.trim() !== "" && otherPeriod.roomNumber === period.roomNumber) {
        conflicts.push(
          `Room ${period.roomNumber} is already in use by ${other.className} at Period ${period.periodNumber} on this day`
        );
      }
    }
  }

  return conflicts;
}

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
        t.periods && t.periods.some((p: any) => p.teacherName === teacherName.trim())
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
    const existingForConflictCheck = await Timetable.findOne({
      className: className.trim(),
      dayOfWeek: dayNum,
      academicYear: academicYear.trim()
    });

    const conflicts = await findScheduleConflicts(
      className.trim(),
      dayNum,
      academicYear.trim(),
      periods,
      existingForConflictCheck ? String(existingForConflictCheck._id) : undefined
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        { message: "Schedule conflict detected", conflicts },
        { status: 409 }
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

    if (periods !== undefined) {
      const existingDoc = await Timetable.findById(id.trim());
      if (!existingDoc) {
        return NextResponse.json({ message: "Timetable not found" }, { status: 404 });
      }

      const checkClassName = (className !== undefined ? className.trim() : existingDoc.className);
      const checkDayOfWeek = (dayOfWeek !== undefined ? parseInt(String(dayOfWeek), 10) : existingDoc.dayOfWeek);
      const checkAcademicYear = (academicYear !== undefined ? academicYear.trim() : existingDoc.academicYear);

      const conflicts = await findScheduleConflicts(
        checkClassName,
        checkDayOfWeek,
        checkAcademicYear,
        periods,
        id.trim()
      );

      if (conflicts.length > 0) {
        return NextResponse.json(
          { message: "Schedule conflict detected", conflicts },
          { status: 409 }
        );
      }
    }

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