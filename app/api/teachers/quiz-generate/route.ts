import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Quiz from "@/app/models/Quiz";
import Teacher from "@/app/models/Teacher";
import { requireTeacher } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireTeacher(request);
    if (auth.error) return auth.error;

    await connectDB();

    const body = await request.json();
    const { className, academicYear, topic, notes, numQuestions } = body;

    if (!className || !academicYear || !topic) {
      return NextResponse.json(
        { message: "className, academicYear and topic are required" },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findById(auth.user.id).lean();
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    const isAllowed = ((teacher as any).assignedClasses || []).some(
      (c: any) => c.className === className
    );
    if (!isAllowed) {
      return NextResponse.json(
        { message: `${className} is not allocated to you. Please select a class you are assigned to.` },
        { status: 403 }
      );
    }

    const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 20);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "Gemini API key is not configured on the server" },
        { status: 500 }
      );
    }

    const prompt = `You are creating a multiple-choice quiz for school students in "${className}" on the topic "${topic}".
${notes ? `Base the questions on this reference material where relevant:\n${notes}\n` : ""}
Generate exactly ${count} multiple-choice questions appropriate for this class level.
Each question must have exactly 4 options, and exactly one correct answer.
Keep language simple and age-appropriate for ${className}.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  questionText: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  correctOptionIndex: { type: "INTEGER" },
                },
                required: ["questionText", "options", "correctOptionIndex"],
              },
            },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { message: "Failed to generate quiz from Gemini" },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { message: "Gemini returned an empty response" },
        { status: 502 }
      );
    }

    let questions;
    try {
      questions = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", rawText);
      return NextResponse.json(
        { message: "Failed to parse generated quiz" },
        { status: 502 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: "Generated quiz was empty or malformed" },
        { status: 502 }
      );
    }

    const validQuestions = questions.filter(
      (q: any) =>
        q &&
        typeof q.questionText === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correctOptionIndex) &&
        q.correctOptionIndex >= 0 &&
        q.correctOptionIndex <= 3
    );

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { message: "None of the generated questions were valid" },
        { status: 502 }
      );
    }

    const quiz = await Quiz.create({
      className,
      academicYear,
      topic,
      notes: notes || "",
      teacherId: auth.user.id,
      questions: validQuestions,
      status: "draft",
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("QUIZ GENERATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate quiz", error: "Server error" },
      { status: 500 }
    );
  }
}