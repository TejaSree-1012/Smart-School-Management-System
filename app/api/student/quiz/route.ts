import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Quiz from "@/app/models/Quiz";
import QuizAttempt from "@/app/models/QuizAttempt";
import Student from "@/app/models/Student";
import { requireStudent } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if (auth.error) return auth.error;

    await connectDB();

    const student = await Student.findById(auth.user.id).lean();
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const className = (student as any).classApplying;

    const quizzes = await Quiz.find({ className, status: "published" })
      .sort({ createdAt: -1 })
      .lean();

    const attempts = await QuizAttempt.find({ studentId: auth.user.id }).lean();
    const attemptMap: Record<string, any> = {};
    for (const a of attempts) {
      attemptMap[String(a.quizId)] = a;
    }

    const result = quizzes.map((q: any) => {
      const attempt = attemptMap[String(q._id)];
      return {
        _id: q._id,
        topic: q.topic,
        className: q.className,
        academicYear: q.academicYear,
        totalQuestions: q.questions.length,
        createdAt: q.createdAt,
        attempted: !!attempt,
        score: attempt ? attempt.score : null,
        // Only send questions (without answers) if not yet attempted
        questions: attempt
          ? undefined
          : q.questions.map((qq: any) => ({
              questionText: qq.questionText,
              options: qq.options,
            })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("STUDENT QUIZ GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}