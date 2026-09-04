import mongoose from "mongoose";

const FEE_TYPES = ["Tuition", "Transport", "Lab", "Exam", "Library", "Sports", "Other"] as const;

const FeeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    term: {
      type: String,
      default: "Full Year",
    },
    feeType: {
      type: String,
      required: true,
      enum: FEE_TYPES,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

FeeStructureSchema.index({ className: 1, academicYear: 1, feeType: 1 });

export default mongoose.models.FeeStructure ||
  mongoose.model("FeeStructure", FeeStructureSchema);
