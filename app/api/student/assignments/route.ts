import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Assignment from "@/app/models/Assignment";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const status = searchParams.get("status") || "active";

    let query: Record<string, unknown> = { status };
    
    if (className) {
      query.className = className;
    }

    const assignments = await Assignment.find(query)
      .sort({ dueDate: 1 })
      .limit(50);

    const now = new Date();
    const assignmentsWithStatus = assignments.map(assignment => ({
      ...assignment.toObject(),
      isPending: assignment.dueDate > now,
      isOverdue: assignment.dueDate < now,
      daysRemaining: Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({ assignments: assignmentsWithStatus });
  } catch (error) {
    console.error("ASSIGNMENTS API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { title, description, className, subject, dueDate, totalMarks, attachments } = body;

    if (!title || !className || !subject || !dueDate) {
      return NextResponse.json(
        { message: "Title, class, subject, and due date are required" },
        { status: 400 }
      );
    }

    const newAssignment = new Assignment({
      title,
      description,
      className,
      subject,
      dueDate: new Date(dueDate),
      totalMarks: totalMarks || 100,
      attachments: attachments || []
    });

    await newAssignment.save();
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error: any) {
    console.error("CREATE ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}
