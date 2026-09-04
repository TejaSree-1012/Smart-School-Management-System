import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import FeePayment from "@/app/models/FeePayment";
import Student from "@/app/models/Student";
import { requireAdmin } from "@/app/lib/auth";

function generateReceiptNumber(): string {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `RCPT-${Date.now()}-${random4}`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const className = searchParams.get("className");
    const academicYear = searchParams.get("academicYear");

    const query: Record<string, unknown> = {};

    if (studentId && studentId.trim() !== "") {
      query.studentId = studentId.trim();
    }

    if (className && className.trim() !== "") {
      query.className = className.trim();
    }

    if (academicYear && academicYear.trim() !== "") {
      query.academicYear = academicYear.trim();
    }

    const payments = await FeePayment.find(query)
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("FEE PAYMENTS GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch fee payments", error: "Database error" },
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
    const {
      studentId,
      className,
      academicYear,
      feeType,
      amountPaid,
      paymentDate,
      paymentMode,
      receiptNumber,
      remarks,
    } = body;

    if (!studentId || String(studentId).trim() === "") {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

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

    if (amountPaid === undefined || amountPaid === null || isNaN(Number(amountPaid))) {
      return NextResponse.json(
        { message: "Amount paid is required and must be a number" },
        { status: 400 }
      );
    }

    if (Number(amountPaid) < 0) {
      return NextResponse.json(
        { message: "Amount paid cannot be negative" },
        { status: 400 }
      );
    }

    if (!paymentMode || paymentMode.trim() === "") {
      return NextResponse.json(
        { message: "Payment mode is required" },
        { status: 400 }
      );
    }

    const validPaymentModes = ["Cash", "Online", "Cheque", "Card"];
    if (!validPaymentModes.includes(paymentMode.trim())) {
      return NextResponse.json(
        { message: `Payment mode must be one of: ${validPaymentModes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate that the student exists
    const student = await Student.findById(studentId.trim()).lean();
    if (!student) {
      return NextResponse.json(
        { message: "Student not found. Please verify the student ID." },
        { status: 404 }
      );
    }

    const studentDoc = student as {
      _id: unknown;
      studentName?: string;
      classApplying?: string;
    };

    const payment = new FeePayment({
      studentId: studentId.trim(),
      studentName: studentDoc.studentName || "",
      className: className.trim(),
      academicYear: academicYear.trim(),
      feeType: feeType.trim(),
      amountPaid: Number(amountPaid),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode: paymentMode.trim(),
      receiptNumber: receiptNumber?.trim() || generateReceiptNumber(),
      remarks: remarks?.trim() || "",
      recordedBy: auth.user.id,
    });

    await payment.save();

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("FEE PAYMENTS POST ERROR:", error);
    return NextResponse.json(
      { message: "Failed to record payment", error: "Database error" },
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
        { message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const payment = await FeePayment.findByIdAndDelete(id.trim());

    if (!payment) {
      return NextResponse.json(
        { message: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Payment record deleted successfully" });
  } catch (error) {
    console.error("FEE PAYMENTS DELETE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete payment record", error: "Database error" },
      { status: 500 }
    );
  }
}
