import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
import connectDB from "@/app/lib/mongodb";
import Parent from "@/app/models/Parent";
import Student from "@/app/models/Student";
import FeeStructure from "@/app/models/FeeStructure";
import FeePayment from "@/app/models/FeePayment";

export async function GET(request: Request) {
  try {
    await connectDB();

    // Auth: same pattern as app/api/parent/marks/route.ts
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Derive current academic year the same way the rest of the codebase does
    const today = new Date();
    const currentYear = today.getFullYear();
    const academicYear =
      today.getMonth() >= 4
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;

    // Look up the parent record to find linked studentId(s)
    // The Parent model stores a single studentId string
    const parentRecord = await Parent.findOne({ email: payload.email }).lean();

    let linkedStudentIds: string[] = [];

    if (parentRecord) {
      const p = parentRecord as { studentId?: string | string[] };
      if (Array.isArray(p.studentId)) {
        linkedStudentIds = p.studentId.filter(Boolean);
      } else if (p.studentId) {
        linkedStudentIds = [p.studentId];
      }
    }

    // Fallback: if parentRecord not found or has no studentId, try payload fields
    if (linkedStudentIds.length === 0) {
      const pid = payload.studentId as string | undefined;
      if (pid) {
        linkedStudentIds = [pid];
      }
    }

    if (linkedStudentIds.length === 0) {
      return NextResponse.json(
        { error: "No linked students found for this parent account" },
        { status: 404 }
      );
    }

    // Build fee status for each linked child
    const results = await Promise.all(
      linkedStudentIds.map(async (sid) => {
        // Resolve the student by their studentId string (same pattern as marks route)
        const student = await Student.findOne({
          studentId: new RegExp(`^${sid}$`, "i"),
        }).lean();

        if (!student) {
          return null;
        }

        const studentDoc = student as {
          _id: unknown;
          studentId: string;
          studentName?: string;
          classApplying?: string;
        };

        const className = studentDoc.classApplying || "";

        // Sum FeeStructure amounts for this class+year (totalDue)
        const feeStructures = await FeeStructure.find({
          className,
          academicYear,
        }).lean();

        const totalDue = (feeStructures as { amount: number }[]).reduce(
          (sum, fs) => sum + fs.amount,
          0
        );

        // Fetch all payments for this student in this academic year
        const payments = await FeePayment.find({
          studentId: String(studentDoc._id),
          academicYear,
        })
          .sort({ paymentDate: -1 })
          .lean();

        const totalPaid = (payments as { amountPaid: number }[]).reduce(
          (sum, p) => sum + p.amountPaid,
          0
        );

        const balance = totalDue - totalPaid;

        function getFeeStatus(totalDue: number, totalPaid: number, balance: number) {
          if (totalDue === 0) return "No Fee Set";
          if (balance <= 0) return "Paid";
          if (totalPaid > 0) return "Partial";
          return "Unpaid";
        }

        const status = getFeeStatus(totalDue, totalPaid, balance);

        const paymentHistory = (
          payments as {
            feeType: string;
            amountPaid: number;
            paymentDate: Date;
            paymentMode: string;
            receiptNumber: string;
          }[]
        ).map((p) => ({
          feeType: p.feeType,
          amountPaid: p.amountPaid,
          paymentDate: p.paymentDate,
          paymentMode: p.paymentMode,
          receiptNumber: p.receiptNumber,
        }));

        return {
          studentName: studentDoc.studentName || "",
          studentId: studentDoc.studentId,
          className,
          academicYear,
          totalDue,
          totalPaid,
          balance,
          status,
          payments: paymentHistory,
        };
      })
    );

    // Filter out null entries (students not found)
    const feeStatus = results.filter(Boolean);

    return NextResponse.json(feeStatus);
  } catch (error) {
    console.error("PARENT FEE STATUS GET ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch fee status" },
      { status: 500 }
    );
  }
}
