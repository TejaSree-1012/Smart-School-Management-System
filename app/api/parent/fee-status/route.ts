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

     const academicYear=new Date().getFullYear().toString();
        // Parent login uses the Student's own MongoDB _id as the JWT "id" —
    // there's no separate Parent record lookup, it's derived directly
    // from the Student document at login time (see app/api/auth/login/route.ts).
    const results = await Promise.all(
      [payload.id].map(async (studentMongoId) => {
        const student = await Student.findById(studentMongoId).lean();

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
            _id: unknown;
            feeType: string;
            amountPaid: number;
            paymentDate: Date;
            paymentMode: string;
            receiptNumber: string;
          }[]
        ).map((p) => ({
          _id: String(p._id),
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
