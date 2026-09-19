import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Quiz from "@/app/models/Quiz";
import QuizAttempt from "@/app/models/QuizAttempt";
import Student from "@/app/models/Student";
import { requireStudent } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireStudent(request);
    if (auth.error) return auth.error;

    await connectDB();

    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: "quizId and answers are required" },
        { status: 400 }
      );
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.status !== "published") {
      return NextResponse.json({ message: "Quiz not available" }, { status: 404 });
    }

    const existing = await QuizAttempt.findOne({ quizId, studentId: auth.user.id });
    if (existing) {
      return NextResponse.json(
        { message: "You have already attempted this quiz" },
        { status: 400 }
      );
    }

    const student = await Student.findById(auth.user.id).lean();

    let score = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctOptionIndex) score += 1;
    });

    const attempt = await QuizAttempt.create({
      quizId,
      studentId: auth.user.id,
      studentIdNumber: (student as any)?.studentId || "",
      studentName: (student as any)?.studentName || "",
      answers,
      score,
      totalQuestions: quiz.questions.length,
    });

    return NextResponse.json({
      score,
      total: quiz.questions.length,
      correctAnswers: quiz.questions.map((q: any) => q.correctOptionIndex),
    });
  } catch (error) {
    console.error("QUIZ SUBMIT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}