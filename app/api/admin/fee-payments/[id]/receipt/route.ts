import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import FeePayment from "@/app/models/FeePayment";
import { requireAdmin } from "@/app/lib/auth";
import PDFDocument from "pdfkit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    await connectDB();
    const { id } = await params;

    const payment = await FeePayment.findById(id).lean();
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfBuffer: Buffer = await new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).font("Helvetica-Bold").text("Smart School", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Fee Payment Receipt", { align: "center" });
      doc.moveDown(1.5);

      doc.fontSize(10);
      doc.text(`Receipt No: ${(payment as any).receiptNumber}`);
      doc.text(`Date: ${new Date((payment as any).paymentDate).toLocaleDateString("en-IN")}`);
      doc.moveDown(0.5);

      doc.text(`Student Name: ${(payment as any).studentName}`);
      doc.text(`Class: ${(payment as any).className}`);
      doc.text(`Academic Year: ${(payment as any).academicYear}`);
      doc.moveDown(0.5);

      doc.text(`Fee Type: ${(payment as any).feeType}`);
      doc.font("Helvetica-Bold").text(
        `Amount Paid: Rs. ${(payment as any).amountPaid.toLocaleString("en-IN")}`
      );
      doc.font("Helvetica").text(`Payment Mode: ${(payment as any).paymentMode}`);

      if ((payment as any).remarks) {
        doc.text(`Remarks: ${(payment as any).remarks}`);
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor("gray").text(
        "This is a computer-generated receipt.",
        { align: "center" }
      );

      doc.end();
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${(payment as any).receiptNumber}.pdf"`
      }
    });
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json(
      { message: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
