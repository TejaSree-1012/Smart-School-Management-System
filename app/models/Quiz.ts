import mongoose from "mongoose";

const QuizQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true },
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  className: { type: String, required: true },
  academicYear: { type: String, required: true },
  topic: { type: String, required: true },
  notes: { type: String, default: "" },
  teacherId: { type: String, required: true },
  questions: { type: [QuizQuestionSchema], required: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);