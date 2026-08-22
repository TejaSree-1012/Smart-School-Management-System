import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  periods: [{
    periodNumber: {
      type: Number,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher"
    },
    teacherName: {
      type: String
    },
    roomNumber: {
      type: String
    },
    isBreak: {
      type: Boolean,
      default: false
    }
  }],
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    default: "Full Year"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
}, { timestamps: true });

TimetableSchema.index({ className: 1, dayOfWeek: 1, academicYear: 1 });

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
