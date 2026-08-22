import mongoose, { Schema, models, model } from "mongoose";

const AttendanceSchema = new Schema({
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
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    required: true,
    default: "present"
  },
  period: {
    type: Number,
    default: 0
  },
  subject: {
    type: String,
    default: "General"
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
  },
  academicYear: {
    type: String,
    default: "2025-2026"
  }
}, { timestamps: true });

AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ className: 1, date: 1 });
AttendanceSchema.index({ date: 1, className: 1 });

const Attendance = models.Attendance || model("Attendance", AttendanceSchema);

export default Attendance;
