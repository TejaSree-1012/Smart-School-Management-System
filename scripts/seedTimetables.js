const mongoose = require("mongoose");
const Timetable = require("../app/models/Timetable");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_school";

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

const DAYS = [
  { id: 1, name: "Monday", periods: [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
    { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "102", isBreak: false },
    { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
    { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "103", isBreak: false },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "104", isBreak: false },
    { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Art & Craft", teacherName: "Meera Singh", roomNumber: "Art Lab", isBreak: false },
    { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Physical Education", teacherName: "Vikram Yadav", roomNumber: "Ground", isBreak: false },
    { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
  ]},
  { id: 2, name: "Tuesday", periods: [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "102", isBreak: false },
    { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
    { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
    { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "103", isBreak: false },
    { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Computer", teacherName: "Rahul Mishra", roomNumber: "Computer Lab", isBreak: false },
    { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Music", teacherName: "Geeta Joshi", roomNumber: "Music Room", isBreak: false },
    { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
  ]},
  { id: 3, name: "Wednesday", periods: [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
    { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "103", isBreak: false },
    { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
    { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "102", isBreak: false },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
    { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "104", isBreak: false },
    { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Library", teacherName: "Priya Sharma", roomNumber: "Library", isBreak: false },
    { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
  ]},
  { id: 4, name: "Thursday", periods: [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "102", isBreak: false },
    { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Science", teacherName: "Dr. Amit Verma", roomNumber: "Lab 1", isBreak: false },
    { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
    { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "Computer", teacherName: "Rahul Mishra", roomNumber: "Computer Lab", isBreak: false },
    { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "103", isBreak: false },
    { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Art & Craft", teacherName: "Meera Singh", roomNumber: "Art Lab", isBreak: false },
    { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
  ]},
  { id: 5, name: "Friday", periods: [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "Hindi", teacherName: "Sunita Devi", roomNumber: "103", isBreak: false },
    { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "Mathematics", teacherName: "Rajesh Kumar", roomNumber: "102", isBreak: false },
    { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
    { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "English", teacherName: "Priya Sharma", roomNumber: "101", isBreak: false },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "EVS", teacherName: "Anita Gupta", roomNumber: "104", isBreak: false },
    { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "Physical Education", teacherName: "Vikram Yadav", roomNumber: "Ground", isBreak: false },
    { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "Music", teacherName: "Geeta Joshi", roomNumber: "Music Room", isBreak: false },
    { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
  ]},
];

const CLASS_SUBJECTS = {
  "Nursery": ["Rhymes", "Colors & Shapes", "Numbers 1-20", "Alphabet", "Drawing"],
  "LKG": ["English", "Hindi", "Mathematics", "EVS", "Art"],
  "UKG": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 1": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 2": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 3": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 9": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  "Class 10": ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
};

const TEACHERS = [
  "Priya Sharma", "Rajesh Kumar", "Sunita Devi", "Anita Gupta",
  "Meera Singh", "Vikram Yadav", "Geeta Joshi", "Rahul Mishra",
  "Dr. Amit Verma", "Neha Kapoor", "Suresh Patel", "Kavita Rao"
];

async function seedTimetables() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Timetable.deleteMany({});
    console.log("Cleared existing timetables");

    const academicYear = new Date().getFullYear().toString();
    const timetables = [];

    for (const className of CLASSES) {
      for (const day of DAYS) {
        const subjects = CLASS_SUBJECTS[className] || CLASS_SUBJECTS["Class 1"];
        const periods = day.periods.map((p, idx) => {
          if (p.isBreak) return { ...p };
          
          const subject = subjects[idx % subjects.length];
          const teacher = TEACHERS[idx % TEACHERS.length];
          const roomNum = String(100 + idx);
          
          return {
            ...p,
            subject,
            teacherName: teacher,
            roomNumber: roomNum
          };
        });

        timetables.push({
          className,
          dayOfWeek: day.id,
          periods,
          academicYear
        });
      }
    }

    await Timetable.insertMany(timetables);
    console.log(`Created ${timetables.length} timetables for ${CLASSES.length} classes`);

    console.log("\nTimetable seed completed successfully!");
    console.log(`Classes: ${CLASSES.join(", ")}`);
    console.log(`Days: ${DAYS.map(d => d.name).join(", ")}`);

  } catch (error) {
    console.error("Error seeding timetables:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedTimetables();
