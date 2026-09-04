import mongoose from "mongoose";

const FEE_TYPES = ["Tuition", "Transport", "Lab", "Exam", "Library", "Sports", "Other"] as const;
const PAYMENT_MODES = ["Cash", "Online", "Cheque", "Card"] as const;

function generateReceiptNumber(): string {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `RCPT-${Date.now()}-${random4}`;
}

const FeePaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    feeType: {
      type: String,
      required: true,
      enum: FEE_TYPES,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      required: true,
      enum: PAYMENT_MODES,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateReceiptNumber,
    },
    remarks: {
      type: String,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

FeePaymentSchema.index({ studentId: 1, academicYear: 1 });

export default mongoose.models.FeePayment ||
  mongoose.model("FeePayment", FeePaymentSchema);
