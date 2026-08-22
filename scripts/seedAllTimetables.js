const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school";

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  assignedClasses: [{ className: String, subject: String }]
}, { timestamps: true });

const TimetableSchema = new mongoose.Schema({
  className: String,
  dayOfWeek: Number,
  periods: [{
    periodNumber: Number,
    startTime: String,
    endTime: String,
    subject: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    teacherName: String,
    roomNumber: String,
    isBreak: Boolean
  }],
  academicYear: String,
  term: String
}, { timestamps: true });

TimetableSchema.index({ className: 1, dayOfWeek: 1, academicYear: 1 });

const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

const CLASS_SUBJECTS = {
  "Nursery": ["Rhymes", "Drawing", "Numbers", "Alphabet", "General Awareness", "Physical Education"],
  "LKG": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Physical Education"],
  "UKG": ["English", "Hindi", "Mathematics", "EVS", "Computer", "Physical Education"],
  "Class 1": ["English", "Hindi", "Mathematics", "EVS", "Computer", "Art"],
  "Class 2": ["English", "Hindi", "Mathematics", "EVS", "Computer", "Art"],
  "Class 3": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 9": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 10": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"]
};

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" }
];

const PERIOD_TIMES = [
  { start: "08:00", end: "08:45" },
  { start: "08:45", end: "09:30" },
  { start: "09:30", end: "09:45" },
  { start: "09:45", end: "10:30" },
  { start: "10:30", end: "11:15" },
  { start: "11:15", end: "12:00" },
  { start: "12:00", end: "12:45" },
  { start: "12:45", end: "13:30" }
];

const ROOMS = [
  "101", "102", "103", "104", "105",
  "201", "202", "203", "204", "205",
  "Lab 1", "Lab 2", "Computer Lab", "Art Room", "Music Room"
];

function normalizeSubject(s) {
  return s.toLowerCase().replace(/\s+/g, "").replace(/studies$/, "science").replace(/&/g, "");
}

function findTeacherForSubject(teachers, className, subject) {
  const normSubject = normalizeSubject(subject);

  const exactMatch = teachers.find(t => {
    const assignments = t.assignedClasses || [];
    return assignments.some(a => a.className === className && a.subject === subject);
  });
  if (exactMatch) return exactMatch;

  const normMatch = teachers.find(t => {
    const assignments = t.assignedClasses || [];
    return assignments.some(a => a.className === className && normalizeSubject(a.subject) === normSubject);
  });
  if (normMatch) return normMatch;

  const subjectMatch = teachers.find(t => {
    const assignments = t.assignedClasses || [];
    return assignments.some(a => a.subject === subject);
  });
  if (subjectMatch) return subjectMatch;

  const normSubjectMatch = teachers.find(t => {
    const assignments = t.assignedClasses || [];
    return assignments.some(a => normalizeSubject(a.subject) === normSubject);
  });
  if (normSubjectMatch) return normSubjectMatch;

  return null;
}

function getSubjectVariant(baseSubject, dayId, periodIndex) {
  const variants = {
    "Physical Education": ["Physical Education", "Sports", "Yoga", "Physical Training"],
    "Art": ["Art", "Drawing", "Art & Craft"],
    "Drawing": ["Drawing", "Art", "Sketching"],
    "Computer": ["Computer", "Computer Science", "IT"],
    "General Awareness": ["General Awareness", "GK", "EVS"],
    "Numbers": ["Numbers", "Mathematics", "Math Basics"],
    "Alphabet": ["Alphabet", "English", "Phonics"]
  };
  const opts = variants[baseSubject];
  if (opts) return opts[(dayId + periodIndex) % opts.length];
  return baseSubject;
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("  SMART SCHOOL - COMPREHENSIVE TIMETABLE SEED");
    console.log("  All Classes, All Teachers, Monday to Saturday");
    console.log("=".repeat(60));

    await mongoose.connect(MONGO_URI);
    console.log("\nConnected to MongoDB:", MONGO_URI);

    const existingTeachers = await Teacher.find({ isActive: { $ne: false } });
    console.log(`\nFound ${existingTeachers.length} existing teachers`);

    const newTeachersData = [
      { name: "Meena Kumari", email: "meena.kumari@school.com", subject: "Hindi", classes: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"] },
      { name: "Lata Joshi", email: "lata.joshi@school.com", subject: "Hindi", classes: ["Nursery", "LKG", "UKG"] },
      { name: "Suresh Babu", email: "suresh.babu@school.com", subject: "EVS", classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2"] },
      { name: "Kavitha Reddy", email: "kavitha.reddy@school.com", subject: "Sanskrit", classes: ["Class 6", "Class 7", "Class 8"] },
      { name: "Rahul Verma", email: "rahul.verma@school.com", subject: "Computer", classes: ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"] },
      { name: "Geetha Narayan", email: "geetha.narayan@school.com", subject: "Art", classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"] },
      { name: "Vikram Yadav", email: "vikram.yadav@school.com", subject: "Physical Education", classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"] },
      { name: "Neha Sharma", email: "neha.sharma@school.com", subject: "English", classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"] },
    ];

    const createdTeachers = [...existingTeachers];

    for (const td of newTeachersData) {
      const exists = existingTeachers.some(t => t.email === td.email);
      if (!exists) {
        const hashedPassword = await require("bcryptjs").hash("teacher123", 10);
        const teacherId = `TCH${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const newTeacher = new Teacher({
          teacherId,
          name: td.name,
          email: td.email,
          password: hashedPassword,
          assignedClasses: td.classes.map(cls => ({ className: cls, subject: td.subject })),
          isActive: true,
          role: "teacher"
        });
        await newTeacher.save();
        createdTeachers.push(newTeacher);
        console.log(`  Created teacher: ${td.name} (${td.subject} for ${td.classes.length} classes)`);
      }
    }

    console.log(`\nTotal teachers available: ${createdTeachers.length}`);
    createdTeachers.forEach(t => {
      const classes = (t.assignedClasses || []).map(a => `${a.className}:${a.subject}`).join(", ");
      console.log(`  - ${t.name} => ${classes || "No assignments"}`);
    });

    console.log("\nClearing existing timetables...");
    await Timetable.deleteMany({});
    console.log("Existing timetables cleared.");

    const academicYear = "2025-2026";
    let totalTimetables = 0;
    let totalPeriods = 0;
    let unassignedPeriods = 0;

    for (const className of CLASSES) {
      const subjects = CLASS_SUBJECTS[className] || [];
      console.log(`\n--- Generating timetable for ${className} (${subjects.length} subjects) ---`);

      for (const day of DAYS) {
        const periods = [];
        let subjectIdx = (day.id - 1) % subjects.length;
        let roomIdx = 0;

        for (let i = 0; i < PERIOD_TIMES.length; i++) {
          const timeSlot = PERIOD_TIMES[i];

          if (i === 2) {
            periods.push({
              periodNumber: i + 1,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              subject: "Break",
              teacherId: null,
              teacherName: "",
              roomNumber: "",
              isBreak: true
            });
          } else if (i === 7) {
            periods.push({
              periodNumber: i + 1,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              subject: "Lunch Break",
              teacherId: null,
              teacherName: "",
              roomNumber: "",
              isBreak: true
            });
          } else {
            const baseSubject = subjects[subjectIdx % subjects.length];
            const subject = getSubjectVariant(baseSubject, day.id, i);
            const teacher = findTeacherForSubject(createdTeachers, className, subject);
            const room = ROOMS[roomIdx % ROOMS.length];

            periods.push({
              periodNumber: i + 1,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              subject: subject,
              teacherId: teacher ? teacher._id : null,
              teacherName: teacher ? teacher.name : "TBA",
              roomNumber: room,
              isBreak: false
            });

            if (!teacher) unassignedPeriods++;
            totalPeriods++;
            subjectIdx++;
            roomIdx++;
          }
        }

        const timetable = new Timetable({
          className,
          dayOfWeek: day.id,
          periods,
          academicYear,
          term: "Full Year"
        });

        await timetable.save();
        totalTimetables++;
      }

      console.log(`  ${className}: ${DAYS.length} days created`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("  SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\nSummary:`);
    console.log(`  Classes: ${CLASSES.length}`);
    console.log(`  Days per class: ${DAYS.length} (Monday - Saturday)`);
    console.log(`  Total timetables: ${totalTimetables}`);
    console.log(`  Total teaching periods: ${totalPeriods}`);
    console.log(`  Unassigned periods (no teacher match): ${unassignedPeriods}`);
    console.log(`  Academic Year: ${academicYear}`);
    console.log(`\nPeriod Schedule:`);
    PERIOD_TIMES.forEach((t, i) => {
      const label = i === 2 ? " (Break)" : i === 7 ? " (Lunch Break)" : "";
      console.log(`  Period ${i + 1}: ${t.start} - ${t.end}${label}`);
    });

    console.log("\nVerifying teacher schedules...");
    for (const teacher of createdTeachers) {
      const teacherTimetables = await Timetable.find({
        "periods.teacherName": teacher.name,
        academicYear
      }).sort({ dayOfWeek: 1 });
      let totalClasses = 0;
      teacherTimetables.forEach(tt => {
        totalClasses += tt.periods.filter(p => p.teacherName === teacher.name && !p.isBreak).length;
      });
      if (totalClasses > 0) {
        console.log(`  ${teacher.name}: ${teacherTimetables.length} days, ${totalClasses} class periods/week`);
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

main();
