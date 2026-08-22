import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
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
  dueDate: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },
  createdByName: {
    type: String
  },
  attachments: [{
    name: String,
    url: String
  }],
  status: {
    type: String,
    enum: ["active", "closed", "draft"],
    default: "active"
  }
}, { timestamps: true });

AssignmentSchema.index({ className: 1, dueDate: 1 });

export default mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);
