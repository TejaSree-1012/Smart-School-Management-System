import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import FeeStructure from "@/app/models/FeeStructure";
import FeePayment from "@/app/models/FeePayment";
import Student from "@/app/models/Student";
import { requireAdmin } from "@/app/lib/auth";

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

function getFeeStatus(totalDue: number, totalPaid: number, balance: number) {
  if (totalDue === 0) return "No Fee Set";
  if (balance <= 0) return "Paid";
  if (totalPaid > 0) return "Partial";
  return "Unpaid";
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");

    if (!academicYear || academicYear.trim() === "") {
      return NextResponse.json(
        { message: "academicYear is required" },
        { status: 400 }
      );
    }

    const academicYearTrimmed = academicYear.trim();

    // Fetch all active students across every class in one query
    const students = await Student.find({
      classApplying: { $in: CLASSES },
      status: "active",
    })
      .select("_id studentId studentName classApplying")
      .lean();

    // Fetch all fee structures for this academic year across every class
    const feeStructures = await FeeStructure.find({
      className: { $in: CLASSES },
      academicYear: academicYearTrimmed,
    }).lean();

    // Sum totalDue per class
    const totalDueByClass: Record<string, number> = {};
    for (const fs of feeStructures as { className: string; amount: number }[]) {
      totalDueByClass[fs.className] = (totalDueByClass[fs.className] || 0) + fs.amount;
    }

    // Fetch all payments for this academic year across every class
    const allPayments = await FeePayment.find({
      className: { $in: CLASSES },
      academicYear: academicYearTrimmed,
    }).lean();

    const paymentsByStudent: Record<string, number> = {};
    for (const payment of allPayments as { studentId: unknown; amountPaid: number }[]) {
      const sid = String(payment.studentId);
      paymentsByStudent[sid] = (paymentsByStudent[sid] || 0) + payment.amountPaid;
    }

    // Build per-student summary, keep only Partial/Unpaid, sort by balance desc
    const report = (
      students as {
        _id: unknown;
        studentId: string;
        studentName?: string;
        classApplying?: string;
      }[]
    )
      .map((student) => {
        const sid = String(student._id);
        const className = student.classApplying || "";
        const totalDue = totalDueByClass[className] || 0;
        const totalPaid = paymentsByStudent[sid] || 0;
        const balance = totalDue - totalPaid;
        const status = getFeeStatus(totalDue, totalPaid, balance);

        return {
          studentName: student.studentName || "",
          studentIdNumber: student.studentId,
          className,
          totalDue,
          totalPaid,
          balance,
          status,
        };
      })
      .filter((s) => s.status === "Partial" || s.status === "Unpaid")
      .sort((a, b) => b.balance - a.balance);

    return NextResponse.json(report);
  } catch (error) {
    console.error("FEE PENDING REPORT GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending dues report", error: "Database error" },
      { status: 500 }
    );
  }
}