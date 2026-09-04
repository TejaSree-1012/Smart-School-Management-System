import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import FeeStructure from "@/app/models/FeeStructure";
import FeePayment from "@/app/models/FeePayment";
import Student from "@/app/models/Student";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const academicYear = searchParams.get("academicYear");

    if (!className || className.trim() === "") {
      return NextResponse.json(
        { message: "className is required" },
        { status: 400 }
      );
    }

    if (!academicYear || academicYear.trim() === "") {
      return NextResponse.json(
        { message: "academicYear is required" },
        { status: 400 }
      );
    }

    const classNameTrimmed = className.trim();
    const academicYearTrimmed = academicYear.trim();

    // Fetch all active students in this class
    const students = await Student.find({
      classApplying: classNameTrimmed,
      status: "active",
    })
      .select("_id studentId studentName classApplying")
      .lean();

    // Sum all FeeStructure amounts for this class+year (totalDue per student is the same)
    const feeStructures = await FeeStructure.find({
      className: classNameTrimmed,
      academicYear: academicYearTrimmed,
    }).lean();

    const totalDue = feeStructures.reduce(
      (sum: number, fs: { amount: number }) => sum + fs.amount,
      0
    );

    // Fetch all payments for this class+year in one query, then group by studentId
    const allPayments = await FeePayment.find({
      className: classNameTrimmed,
      academicYear: academicYearTrimmed,
    }).lean();

    const paymentsByStudent: Record<string, number> = {};
    for (const payment of allPayments as { studentId: unknown; amountPaid: number }[]) {
      const sid = String(payment.studentId);
      paymentsByStudent[sid] = (paymentsByStudent[sid] || 0) + payment.amountPaid;
    }

    // Build summary for each student
    const summary = (
      students as {
        _id: unknown;
        studentId: string;
        studentName?: string;
        classApplying?: string;
      }[]
    ).map((student) => {
      const sid = String(student._id);
      const totalPaid = paymentsByStudent[sid] || 0;
      const balance = totalDue - totalPaid;

      function getFeeStatus(totalDue: number, totalPaid: number, balance: number) {
        if (totalDue === 0) return "No Fee Set";
        if (balance <= 0) return "Paid";
        if (totalPaid > 0) return "Partial";
        return "Unpaid";
      }

      const status = getFeeStatus(totalDue, totalPaid, balance);

      return {
        studentId: sid,
        studentName: student.studentName || "",
        studentIdNumber: student.studentId,
        totalDue,
        totalPaid,
        balance,
        status,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("FEE SUMMARY GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch fee summary", error: "Database error" },
      { status: 500 }
    );
  }
}
