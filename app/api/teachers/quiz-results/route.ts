import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Quiz from "@/app/models/Quiz";
import QuizAttempt from "@/app/models/QuizAttempt";
import Student from "@/app/models/Student";
import { requireTeacher } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    if (!quizId) {
      return NextResponse.json({ message: "quizId is required" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }
    if ((quiz as any).teacherId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const students = await Student.find({
      classApplying: (quiz as any).className,
      status: "active",
    })
      .select("_id studentId studentName")
      .lean();

    const attempts = await QuizAttempt.find({ quizId }).lean();
    const attemptMap: Record<string, any> = {};
    for (const a of attempts as any[]) {
      attemptMap[String(a.studentId)] = a;
    }

    const results = (students as any[]).map((s) => {
      const attempt = attemptMap[String(s._id)];
      return {
        studentId: String(s._id),
        studentIdNumber: s.studentId,
        studentName: s.studentName,
        attempted: !!attempt,
        score: attempt ? attempt.score : null,
        submittedAt: attempt ? attempt.createdAt : null,
      };
    });

    results.sort((a, b) => {
      if (a.attempted !== b.attempted) return a.attempted ? -1 : 1;
      return a.studentName.localeCompare(b.studentName);
    });

    return NextResponse.json({
      topic: (quiz as any).topic,
      className: (quiz as any).className,
      totalQuestions: (quiz as any).questions.length,
      totalStudents: students.length,
      attemptedCount: attempts.length,
      results,
    });
  } catch (error) {
    console.error("QUIZ RESULTS GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}