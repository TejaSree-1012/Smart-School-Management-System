const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school";

const TeacherSchema = new mongoose.Schema({
  teacherId: String, name: String, email: String, password: String,
  phone: String, gender: String, qualification: String, specialization: String,
  experience: Number, department: String, designation: String,
  assignedClasses: [{ className: String, subject: String }],
  isActive: { type: Boolean, default: true }, role: { type: String, default: "teacher" }
}, { timestamps: true });

const TimetableSchema = new mongoose.Schema({
  className: { type: String, required: true },
  dayOfWeek: { type: Number, required: true },
  periods: [{
    periodNumber: Number, startTime: String, endTime: String,
    subject: String, teacherId: mongoose.Schema.Types.ObjectId,
    teacherName: String, roomNumber: String, isBreak: { type: Boolean, default: false }
  }],
  academicYear: { type: String, required: true },
  term: { type: String, default: "Full Year" }
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
  "Nursery": ["English", "Hindi", "Mathematics", "Drawing", "EVS", "Physical Education"],
  "LKG":     ["English", "Hindi", "Mathematics", "Drawing", "EVS", "Physical Education"],
  "UKG":     ["English", "Hindi", "Mathematics", "Computer", "EVS", "Physical Education"],
  "Class 1": ["English", "Hindi", "Mathematics", "Computer", "Art", "EVS"],
  "Class 2": ["English", "Hindi", "Mathematics", "Computer", "Art", "EVS"],
  "Class 3": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 9": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 10":["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"]
};

const DAYS = [
  { id: 1, name: "Monday" }, { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" }, { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" }, { id: 6, name: "Saturday" }
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

const ROOMS = ["101", "102", "103", "104", "105", "201", "202", "203", "204", "205", "Lab 1", "Lab 2", "Computer Lab", "Art Room"];

const TEACHERS_DATA = [
  {
    name: "Neha Sharma", email: "neha.sharma@school.com",
    qualification: "M.A. English, B.Ed.", specialization: "English", experience: 8,
    department: "Primary Wing",
    assignedClasses: [
      { className: "Nursery", subject: "English" }, { className: "LKG", subject: "English" },
      { className: "UKG", subject: "English" }, { className: "Class 1", subject: "English" },
      { className: "Class 2", subject: "English" }, { className: "Class 3", subject: "English" },
      { className: "Class 4", subject: "English" }, { className: "Class 5", subject: "English" }
    ]
  },
  {
    name: "Anita Desai", email: "anita.desai@school.com",
    qualification: "M.A. English, B.Ed.", specialization: "English", experience: 12,
    department: "Senior Wing",
    assignedClasses: [
      { className: "Class 6", subject: "English" }, { className: "Class 7", subject: "English" },
      { className: "Class 8", subject: "English" }, { className: "Class 9", subject: "English" },
      { className: "Class 10", subject: "English" }
    ]
  },
  {
    name: "Lata Joshi", email: "lata.joshi@school.com",
    qualification: "M.A. Hindi, B.Ed.", specialization: "Hindi", experience: 10,
    department: "Primary Wing",
    assignedClasses: [
      { className: "Nursery", subject: "Hindi" }, { className: "LKG", subject: "Hindi" },
      { className: "UKG", subject: "Hindi" }, { className: "Class 1", subject: "Hindi" },
      { className: "Class 2", subject: "Hindi" }, { className: "Class 3", subject: "Hindi" },
      { className: "Class 4", subject: "Hindi" }, { className: "Class 5", subject: "Hindi" }
    ]
  },
  {
    name: "Kavitha Reddy", email: "kavitha.reddy@school.com",
    qualification: "M.A. Hindi, B.Ed.", specialization: "Hindi", experience: 9,
    department: "Senior Wing",
    assignedClasses: [
      { className: "Class 6", subject: "Hindi" }, { className: "Class 7", subject: "Hindi" },
      { className: "Class 8", subject: "Hindi" }, { className: "Class 9", subject: "Hindi" },
      { className: "Class 10", subject: "Hindi" }
    ]
  },
  {
    name: "Suresh Babu", email: "suresh.babu@school.com",
    qualification: "M.Sc. Mathematics, B.Ed.", specialization: "Mathematics", experience: 7,
    department: "Primary Wing",
    assignedClasses: [
      { className: "Nursery", subject: "Mathematics" }, { className: "LKG", subject: "Mathematics" },
      { className: "UKG", subject: "Mathematics" }, { className: "Class 1", subject: "Mathematics" },
      { className: "Class 2", subject: "Mathematics" }
    ]
  },
  {
    name: "Meena Kumari", email: "meena.kumari@school.com",
    qualification: "M.Sc. Mathematics, B.Ed.", specialization: "Mathematics", experience: 11,
    department: "Middle Wing",
    assignedClasses: [
      { className: "Class 3", subject: "Mathematics" }, { className: "Class 4", subject: "Mathematics" },
      { className: "Class 5", subject: "Mathematics" }, { className: "Class 6", subject: "Mathematics" },
      { className: "Class 7", subject: "Mathematics" }, { className: "Class 8", subject: "Mathematics" }
    ]
  },
  {
    name: "Deepa Nair", email: "deepa.nair@school.com",
    qualification: "M.Sc. Mathematics, Ph.D.", specialization: "Mathematics", experience: 15,
    department: "Senior Wing",
    assignedClasses: [
      { className: "Class 9", subject: "Mathematics" }, { className: "Class 10", subject: "Mathematics" }
    ]
  },
  {
    name: "Sunita Patel", email: "sunita.patel@school.com",
    qualification: "M.Sc. Physics, B.Ed.", specialization: "Science", experience: 10,
    department: "Middle Wing",
    assignedClasses: [
      { className: "Class 3", subject: "Science" }, { className: "Class 4", subject: "Science" },
      { className: "Class 5", subject: "Science" }, { className: "Class 6", subject: "Science" },
      { className: "Class 7", subject: "Science" }, { className: "Class 8", subject: "Science" }
    ]
  },
  {
    name: "Dr. Amit Verma", email: "amit.verma@school.com",
    qualification: "M.Sc. Chemistry, Ph.D.", specialization: "Science", experience: 18,
    department: "Senior Wing",
    assignedClasses: [
      { className: "Class 9", subject: "Science" }, { className: "Class 10", subject: "Science" }
    ]
  },
  {
    name: "Vikram Singh", email: "vikram.singh@school.com",
    qualification: "M.A. Geography, B.Ed.", specialization: "Social Science", experience: 14,
    department: "Middle Wing",
    assignedClasses: [
      { className: "Class 3", subject: "Social Science" }, { className: "Class 4", subject: "Social Science" },
      { className: "Class 5", subject: "Social Science" }, { className: "Class 6", subject: "Social Science" },
      { className: "Class 7", subject: "Social Science" }, { className: "Class 8", subject: "Social Science" },
      { className: "Class 9", subject: "Social Science" }, { className: "Class 10", subject: "Social Science" }
    ]
  },
  {
    name: "Rahul Verma", email: "rahul.verma@school.com",
    qualification: "MCA, B.Ed.", specialization: "Computer", experience: 6,
    department: "All Wings",
    assignedClasses: [
      { className: "UKG", subject: "Computer" }, { className: "Class 1", subject: "Computer" },
      { className: "Class 2", subject: "Computer" }, { className: "Class 3", subject: "Computer" },
      { className: "Class 4", subject: "Computer" }, { className: "Class 5", subject: "Computer" }
    ]
  },
  {
    name: "Kamala Devi", email: "kamala.devi@school.com",
    qualification: "M.A. EVS, B.Ed.", specialization: "EVS", experience: 8,
    department: "Primary Wing",
    assignedClasses: [
      { className: "Nursery", subject: "EVS" }, { className: "LKG", subject: "EVS" },
      { className: "UKG", subject: "EVS" }, { className: "Class 1", subject: "EVS" },
      { className: "Class 2", subject: "EVS" }
    ]
  },
  {
    name: "Geetha Narayan", email: "geetha.narayan@school.com",
    qualification: "MFA, B.Ed.", specialization: "Art & Drawing", experience: 9,
    department: "Primary Wing",
    assignedClasses: [
      { className: "Nursery", subject: "Drawing" }, { className: "LKG", subject: "Drawing" },
      { className: "UKG", subject: "Drawing" }, { className: "Class 1", subject: "Art" },
      { className: "Class 2", subject: "Art" }
    ]
  },
  {
    name: "Neha Kapoor", email: "neha.kapoor@school.com",
    qualification: "M.A. Sanskrit, B.Ed.", specialization: "Sanskrit", experience: 7,
    department: "Middle Wing",
    assignedClasses: [
      { className: "Class 6", subject: "Sanskrit" }, { className: "Class 7", subject: "Sanskrit" },
      { className: "Class 8", subject: "Sanskrit" }
    ]
  },
  {
    name: "Vikram Yadav", email: "vikram.yadav@school.com",
    qualification: "M.P.Ed.", specialization: "Physical Education", experience: 13,
    department: "All Wings",
    assignedClasses: [
      { className: "Nursery", subject: "Physical Education" }, { className: "LKG", subject: "Physical Education" },
      { className: "UKG", subject: "Physical Education" }
    ]
  },
  {
    name: "Bhargavi", email: "bhargavi@school.com",
    qualification: "M.Tech. CSE, B.Ed.", specialization: "Computer", experience: 5,
    department: "Senior Wing",
    assignedClasses: [
      { className: "Class 9", subject: "Computer" }, { className: "Class 10", subject: "Computer" }
    ]
  }
];

function findTeacher(teachers, className, subject) {
  for (const t of teachers) {
    if (t.assignedClasses.some(a => a.className === className && a.subject === subject)) {
      return t;
    }
  }
  return null;
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("  SMART SCHOOL - CLEAN SEED");
    console.log("  Fresh Teachers + Matching Timetables");
    console.log("=".repeat(60));

    await mongoose.connect(MONGO_URI);
    console.log("\nConnected to MongoDB:", MONGO_URI);

    console.log("\n--- Cleaning old data ---");
    const dt = await Teacher.deleteMany({});
    const dtt = await Timetable.deleteMany({});
    console.log(`  Deleted ${dt.deletedCount} teachers, ${dtt.deletedCount} timetables`);

    console.log("\n--- Creating teachers ---");
    const hashedPassword = await bcrypt.hash("teacher123", 10);
    const createdTeachers = [];

    for (const td of TEACHERS_DATA) {
      const teacherId = `TCH-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const teacher = new Teacher({
        teacherId, name: td.name, email: td.email, password: hashedPassword,
        qualification: td.qualification, specialization: td.specialization,
        experience: td.experience, department: td.department, designation: "Teacher",
        assignedClasses: td.assignedClasses, isActive: true, role: "teacher"
      });
      await teacher.save();
      createdTeachers.push(teacher);
      const assigns = td.assignedClasses.map(a => `${a.className}:${a.subject}`).join(", ");
      console.log(`  + ${td.name} => ${assigns}`);
    }

    console.log(`\n  Total teachers: ${createdTeachers.length}`);

    console.log("\n--- Validating teacher coverage ---");
    let allCovered = true;
    for (const className of CLASSES) {
      const subjects = CLASS_SUBJECTS[className];
      const missing = [];
      for (const subj of subjects) {
        const teacher = findTeacher(createdTeachers, className, subj);
        if (!teacher) missing.push(subj);
      }
      if (missing.length > 0) {
        console.log(`  WARNING: ${className} missing teachers for: ${missing.join(", ")}`);
        allCovered = false;
      }
    }
    if (allCovered) console.log("  All classes fully covered by teachers!");

    console.log("\n--- Generating timetables ---");
    const academicYear = "2025-2026";
    let totalTimetables = 0;
    let totalTeachingPeriods = 0;

    for (let ci = 0; ci < CLASSES.length; ci++) {
      const className = CLASSES[ci];
      const subjects = CLASS_SUBJECTS[className];

      for (const day of DAYS) {
        const rotatedSubjects = [];
        for (let i = 0; i < subjects.length; i++) {
          rotatedSubjects.push(subjects[(i + day.id - 1 + ci) % subjects.length]);
        }

        const periods = [];
        let subjIdx = 0;

        for (let i = 0; i < PERIOD_TIMES.length; i++) {
          const ts = PERIOD_TIMES[i];

          if (i === 2) {
            periods.push({
              periodNumber: i + 1, startTime: ts.start, endTime: ts.end,
              subject: "Break", teacherId: null, teacherName: "",
              roomNumber: "", isBreak: true
            });
          } else if (i === 7) {
            periods.push({
              periodNumber: i + 1, startTime: ts.start, endTime: ts.end,
              subject: "Lunch Break", teacherId: null, teacherName: "",
              roomNumber: "", isBreak: true
            });
          } else {
            const subject = rotatedSubjects[subjIdx % rotatedSubjects.length];
            const teacher = findTeacher(createdTeachers, className, subject);
            const room = teacher ? ROOMS[(subjIdx + day.id) % ROOMS.length] : "TBA";

            periods.push({
              periodNumber: i + 1, startTime: ts.start, endTime: ts.end,
              subject, teacherId: teacher ? teacher._id : null,
              teacherName: teacher ? teacher.name : "TBA",
              roomNumber: room, isBreak: false
            });
            subjIdx++;
            totalTeachingPeriods++;
          }
        }

        const timetable = new Timetable({
          className, dayOfWeek: day.id, periods, academicYear, term: "Full Year"
        });
        await timetable.save();
        totalTimetables++;
      }
      console.log(`  ${className}: 6 days created`);
    }

    console.log("\n--- Verifying teacher schedules ---");
    for (const teacher of createdTeachers) {
      const tts = await Timetable.find({ "periods.teacherName": teacher.name, academicYear }).sort({ dayOfWeek: 1 });
      let perWeek = 0;
      const daysMap = {};
      tts.forEach(tt => {
        const dayName = DAYS.find(d => d.id === tt.dayOfWeek)?.name;
        const count = tt.periods.filter(p => p.teacherName === teacher.name && !p.isBreak).length;
        if (count > 0) {
          daysMap[dayName] = (daysMap[dayName] || 0) + count;
          perWeek += count;
        }
      });
      const dayStr = Object.entries(daysMap).map(([d, c]) => `${d}(${c})`).join(", ");
      console.log(`  ${teacher.name}: ${perWeek} periods/week [${dayStr}]`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("  SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`  Teachers: ${createdTeachers.length}`);
    console.log(`  Classes: ${CLASSES.length} | Days: ${DAYS.length} | Timetables: ${totalTimetables}`);
    console.log(`  Total teaching periods/week: ${totalTeachingPeriods}`);
    console.log(`  Academic Year: ${academicYear}`);
    console.log("\n  Teacher login: email as listed above, password: teacher123");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

main();
