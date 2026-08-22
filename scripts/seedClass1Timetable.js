const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school";

const TimetableSchema = new mongoose.Schema({
  className: { type: String, required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  periods: [{
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true },
    teacherName: { type: String, default: "" },
    roomNumber: { type: String, default: "" },
    isBreak: { type: Boolean, default: false }
  }],
  academicYear: { type: String, required: true },
  term: { type: String, default: "Full Year" }
}, { timestamps: true });

const Timetable = mongoose.model("Timetable", TimetableSchema);

const CLASS_1_TIMETABLE = {
  className: "Class 1",
  academicYear: new Date().getFullYear().toString(),
  days: [
    {
      dayOfWeek: 1,
      dayName: "Monday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "103", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Art & Craft", teacherName: "Meera Singh", roomNumber: "Art Lab", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Physical Education", teacherName: "Vikram Yadav", roomNumber: "Ground", isBreak: false },
        { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true }
      ]
    },
    {
      dayOfWeek: 2,
      dayName: "Tuesday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Computer", teacherName: "Rahul Mishra", roomNumber: "Computer Lab", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Music", teacherName: "Geeta Joshi", roomNumber: "Music Room", isBreak: false },
        { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true }
      ]
    },
    {
      dayOfWeek: 3,
      dayName: "Wednesday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "103", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Library", teacherName: "Priya Sharma", roomNumber: "Library", isBreak: false },
        { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true }
      ]
    },
    {
      dayOfWeek: 4,
      dayName: "Thursday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Computer", teacherName: "Rahul Mishra", roomNumber: "Computer Lab", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Art & Craft", teacherName: "Meera Singh", roomNumber: "Art Lab", isBreak: false },
        { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true }
      ]
    },
    {
      dayOfWeek: 5,
      dayName: "Friday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "103", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Physical Education", teacherName: "Vikram Yadav", roomNumber: "Ground", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Music", teacherName: "Geeta Joshi", roomNumber: "Music Room", isBreak: false },
        { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true }
      ]
    },
    {
      dayOfWeek: 6,
      dayName: "Saturday",
      periods: [
        { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
        { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "101", isBreak: false },
        { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
        { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "102", isBreak: false },
        { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
        { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "103", isBreak: false },
        { periodNumber: 7, startTime: "12:00", endTime: "12:30", subject: "Special Activity", teacherName: "Meera Singh", roomNumber: "Activity Hall", isBreak: false }
      ]
    }
  ]
};

async function seedClass1Timetable() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\nClearing all existing timetables...");
    await Timetable.deleteMany({});
    console.log("All timetables cleared!");

    console.log("\nCreating Class 1 timetable for the week...");
    const timetablesToInsert = CLASS_1_TIMETABLE.days.map(day => ({
      className: CLASS_1_TIMETABLE.className,
      dayOfWeek: day.dayOfWeek,
      academicYear: CLASS_1_TIMETABLE.academicYear,
      periods: day.periods,
      term: "Full Year"
    }));

    const result = await Timetable.insertMany(timetablesToInsert);
    console.log(`\nSuccessfully inserted ${result.length} timetable documents!`);

    console.log("\nCreated timetables:");
    timetablesToInsert.forEach((t) => {
      const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      console.log(`  - ${t.className} - ${dayNames[t.dayOfWeek]}: ${t.periods.filter(p => !p.isBreak).length} classes`);
    });

    console.log("\n========================================");
    console.log("Timetable seed completed successfully!");
    console.log("========================================");
    console.log("\nNext steps:");
    console.log("1. Go to Admin Dashboard > Timetable");
    console.log("2. Select 'Class 1' from dropdown");
    console.log("3. View/Edit timetable for each day");

  } catch (error) {
    console.error("Error seeding timetable:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

seedClass1Timetable();
