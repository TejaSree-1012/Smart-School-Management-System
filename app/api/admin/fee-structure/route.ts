import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import FeeStructure from "@/app/models/FeeStructure";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const academicYear = searchParams.get("academicYear");

    const query: Record<string, string> = {};

    if (className && className.trim() !== "") {
      query.className = className.trim();
    }

    if (academicYear && academicYear.trim() !== "") {
      query.academicYear = academicYear.trim();
    }

    const feeStructures = await FeeStructure.find(query)
      .sort({ className: 1, feeType: 1 })
      .lean();

    return NextResponse.json(feeStructures);
  } catch (error) {
    console.error("FEE STRUCTURE GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch fee structure", error: "Database error" },
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
    const { className, academicYear, term, feeType, amount, dueDate } = body;

    if (!className || className.trim() === "") {
      return NextResponse.json(
        { message: "Class name is required" },
        { status: 400 }
      );
    }

    if (!academicYear || academicYear.trim() === "") {
      return NextResponse.json(
        { message: "Academic year is required" },
        { status: 400 }
      );
    }

    if (!feeType || feeType.trim() === "") {
      return NextResponse.json(
        { message: "Fee type is required" },
        { status: 400 }
      );
    }

    const validFeeTypes = ["Tuition", "Transport", "Lab", "Exam", "Library", "Sports", "Other"];
    if (!validFeeTypes.includes(feeType.trim())) {
      return NextResponse.json(
        { message: `Fee type must be one of: ${validFeeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json(
        { message: "Amount is required and must be a number" },
        { status: 400 }
      );
    }

    if (Number(amount) < 0) {
      return NextResponse.json(
        { message: "Amount cannot be negative" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      term: term?.trim() || "Full Year",
      amount: Number(amount),
      createdBy: auth.user.id,
    };

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    // Upsert: if the same className+academicYear+feeType already exists, update it
    const feeStructure = await FeeStructure.findOneAndUpdate(
      {
        className: className.trim(),
        academicYear: academicYear.trim(),
        feeType: feeType.trim(),
      },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(feeStructure, { status: 201 });
  } catch (error) {
    console.error("FEE STRUCTURE POST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save fee structure", error: "Database error" },
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
      return NextResponse.json(
        { message: "Fee structure ID is required" },
        { status: 400 }
      );
    }

    const feeStructure = await FeeStructure.findByIdAndDelete(id.trim());

    if (!feeStructure) {
      return NextResponse.json(
        { message: "Fee structure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    console.error("FEE STRUCTURE DELETE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete fee structure", error: "Database error" },
      { status: 500 }
    );
  }
}
