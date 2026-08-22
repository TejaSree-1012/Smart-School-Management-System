import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Timetable from "@/app/models/Timetable";
import Teacher from "@/app/models/Teacher";
import Student from "@/app/models/Student";
import { requireTeacher } from "@/app/lib/auth";

function getAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const teacher = await Teacher.findById(auth.user.id);
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const assignedClasses = teacher.assignedClasses || [];
    const assignedClassNames = [...new Set(assignedClasses.map((c: any) => c.className))];
    const assignedSubjects = [...new Set(assignedClasses.map((c: any) => c.subject))];

    const assignedClassSubjects: Record<string, string[]> = {};
    assignedClasses.forEach((c: any) => {
      if (!assignedClassSubjects[c.className]) {
        assignedClassSubjects[c.className] = [];
      }
      if (!assignedClassSubjects[c.className].includes(c.subject)) {
        assignedClassSubjects[c.className].push(c.subject);
      }
    });

    const today = new Date();
    const jsDay = today.getDay();
    const dbDay = jsDay === 0 ? 0 : jsDay;
    const academicYear = getAcademicYear();

    const todaySchedule: any[] = [];

    if (dbDay >= 1 && dbDay <= 6) {
      let timetables = await Timetable.find({
        className: { $in: assignedClassNames },
        dayOfWeek: dbDay,
        academicYear
      }).lean();

      if (timetables.length === 0) {
        timetables = await Timetable.find({
          className: { $in: assignedClassNames },
          dayOfWeek: dbDay
        }).lean();
      }

      for (const tt of timetables) {
        for (const period of tt.periods) {
          if (period.teacherName === teacher.name && !period.isBreak) {
            todaySchedule.push({
              _id: `${tt._id}-${period.periodNumber}`,
              time: `${period.startTime} - ${period.endTime}`,
              subject: period.subject,
              className: tt.className,
              periodType: "Class",
              room: period.roomNumber || "",
              startTime: period.startTime,
              periodNumber: period.periodNumber
            });
          }
        }

        for (const period of tt.periods) {
          if (period.isBreak && !todaySchedule.some(s => s.periodNumber === period.periodNumber && s.periodType === "Break")) {
            todaySchedule.push({
              _id: `${tt._id}-break-${period.periodNumber}`,
              time: `${period.startTime} - ${period.endTime}`,
              subject: period.subject || "Break",
              className: "",
              periodType: "Break",
              room: "",
              startTime: period.startTime,
              periodNumber: period.periodNumber
            });
          }
        }
      }
    }

    todaySchedule.sort((a, b) => a.periodNumber - b.periodNumber);

    const uniqueTodayClasses = [...new Set(
      todaySchedule.filter(s => s.periodType === "Class").map(s => s.className)
    )];

    const totalStudentsCount = await Student.countDocuments({
      classApplying: { $in: assignedClassNames },
      status: "active"
    });

    return NextResponse.json({
      teacher: {
        name: teacher.name,
        email: teacher.email,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        experience: teacher.experience,
        department: teacher.department,
        designation: teacher.designation,
        assignedClasses: assignedClassNames,
        assignedSubjects: assignedSubjects,
        assignedClassSubjects: assignedClassSubjects
      },
      stats: {
        totalClasses: assignedClassNames.length,
        totalStudents: totalStudentsCount,
        totalSubjects: assignedSubjects.length,
        todayClasses: uniqueTodayClasses.length,
        todayPeriods: todaySchedule.filter(s => s.periodType === "Class").length,
        subjects: assignedSubjects,
        classSubjects: assignedClassSubjects
      },
      todaySchedule,
      announcements: []
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
