import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Quiz from "@/app/models/Quiz";
import QuizAttempt from "@/app/models/QuizAttempt";
import { requireTeacher } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const quizzes = await Quiz.find({ teacherId: auth.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const quizIds = quizzes.map((q: any) => q._id);
    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: "$quizId", count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    for (const a of attemptCounts) {
      countMap[String(a._id)] = a.count;
    }

    const result = quizzes.map((q: any) => ({
      ...q,
      attemptCount: countMap[String(q._id)] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("QUIZ LIST GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const body = await request.json();
    const { quizId, questions, status } = body;

    if (!quizId) {
      return NextResponse.json({ message: "quizId is required" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }
    if (quiz.teacherId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (questions) {
      quiz.questions = questions;
    }
    if (status && ["draft", "published"].includes(status)) {
      quiz.status = status;
    }

    await quiz.save();
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("QUIZ PATCH ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ message: "quizId is required" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }
    if (quiz.teacherId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (quiz.status !== "draft") {
      return NextResponse.json(
        { message: "Only draft quizzes can be deleted" },
        { status: 400 }
      );
    }

    await Quiz.deleteOne({ _id: quizId });
    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    console.error("QUIZ DELETE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}