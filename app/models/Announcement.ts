import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["info", "warning", "success", "important"],
    default: "info"
  },
  priority: {
    type: String,
    enum: ["normal", "high", "urgent"],
    default: "normal"
  },
  targetAudience: {
    type: String,
    enum: ["all", "students", "teachers", "parents", "specific"],
    default: "all"
  },
  targetClasses: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

AnnouncementSchema.index({ isActive: 1, expiresAt: 1, targetAudience: 1 });

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
