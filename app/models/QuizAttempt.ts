import mongoose from "mongoose";

const QuizAttemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  studentId: { type: String, required: true },
  studentIdNumber: { type: String, default: "" },
  studentName: { type: String, default: "" },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
}, { timestamps: true });

QuizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", QuizAttemptSchema);