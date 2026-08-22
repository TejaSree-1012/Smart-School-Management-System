import mongoose, { Schema, models, model } from "mongoose";

const MarkSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    required: true,
    enum: [
      "Periodic Test 1",
      "Periodic Test 2", 
      "Periodic Test 3",
      "Half Yearly Exam",
      "Annual Exam",
      "Unit Test 1",
      "Unit Test 2",
      "Unit Test 3",
      "Subject Enrichment",
      "Portfolio",
      "Multiple Assessment",
      "Quiz"
    ],
    default: "Periodic Test 1"
  },
  term: {
    type: String,
    required: true,
    enum: ["Term 1", "Term 2", "Term 3"],
    default: "Term 1"
  },
  academicYear: {
    type: String,
    required: true,
    default: "2025-2026"
  },
  marks: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  grade: {
    type: String
  },
  gradePoint: {
    type: Number
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },
  teacherName: {
    type: String
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

MarkSchema.index({ studentId: 1, subject: 1, examType: 1, term: 1, academicYear: 1 }, { unique: true });
MarkSchema.index({ className: 1, subject: 1, examType: 1, term: 1 });

const Mark = models.Mark || model("Mark", MarkSchema);

export default Mark;
