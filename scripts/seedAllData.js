const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_school";

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  password: String,
  assignedClasses: [{
    className: String,
    subject: String
  }]
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
  academicYear: String
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

const CLASS_SUBJECTS = {
  "Nursery": ["Rhymes", "Colors & Shapes", "Numbers 1-20", "Alphabet", "Drawing"],
  "LKG": ["English", "Hindi", "Mathematics", "EVS", "Art"],
  "UKG": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 1": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 2": ["English", "Hindi", "Mathematics", "EVS", "Computer"],
  "Class 3": ["English", "Hindi", "Mathematics", "Science", "Social Science"],
  "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Science"],
  "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Science"],
  "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  "Class 9": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"],
  "Class 10": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"]
};

const TEACHER_ASSIGNMENTS = {
  "Mathematics": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "Science": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "English": ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "Hindi": ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "Social Science": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "Computer": ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  "Sanskrit": ["Class 6", "Class 7", "Class 8"],
  "EVS": ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
  "Art": ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"],
  "Rhymes": ["Nursery", "LKG", "UKG"],
  "Drawing": ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"]
};

const ROOMS = ["101", "102", "103", "104", "105", "201", "202", "203", "Lab 1", "Lab 2", "Computer Lab", "Art Room", "Music Room"];

async function assignTeachersToClasses() {
  console.log("\n=== Step 1: Assigning Classes and Subjects to Teachers ===\n");
  
  const teachers = await Teacher.find({});
  console.log(`Found ${teachers.length} teachers`);
  
  for (const teacher of teachers) {
    const teacherName = teacher.name || "";
    const nameLower = teacherName.toLowerCase();
    
    let assignedClasses = [];
    
    if (nameLower.includes("math") || nameLower.includes("rajesh")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Mathematics"].map(cls => ({ className: cls, subject: "Mathematics" }));
    } else if (nameLower.includes("science") || nameLower.includes("amit") || nameLower.includes("verma")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Science"].map(cls => ({ className: cls, subject: "Science" }));
    } else if (nameLower.includes("english") || nameLower.includes("priya") || nameLower.includes("sharma")) {
      assignedClasses = TEACHER_ASSIGNMENTS["English"].map(cls => ({ className: cls, subject: "English" }));
    } else if (nameLower.includes("hindi") || nameLower.includes("sunita") || nameLower.includes("devi")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Hindi"].map(cls => ({ className: cls, subject: "Hindi" }));
    } else if (nameLower.includes("social") || nameLower.includes("anita") || nameLower.includes("gupta")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Social Science"].map(cls => ({ className: cls, subject: "Social Science" }));
    } else if (nameLower.includes("computer") || nameLower.includes("rahul") || nameLower.includes("mishra")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Computer"].map(cls => ({ className: cls, subject: "Computer" }));
    } else if (nameLower.includes("sanskrit") || nameLower.includes("neha") || nameLower.includes("kapoor")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Sanskrit"].map(cls => ({ className: cls, subject: "Sanskrit" }));
    } else if (nameLower.includes("evs") || nameLower.includes("meera") || nameLower.includes("singh")) {
      assignedClasses = TEACHER_ASSIGNMENTS["EVS"].map(cls => ({ className: cls, subject: "EVS" }));
    } else if (nameLower.includes("art") || nameLower.includes("drawing") || nameLower.includes("meera")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Art"].map(cls => ({ className: cls, subject: "Art" }));
    } else if (nameLower.includes("music") || nameLower.includes("geeta") || nameLower.includes("joshi")) {
      assignedClasses = TEACHER_ASSIGNMENTS["Rhymes"].map(cls => ({ className: cls, subject: "Rhymes" }));
    } else {
      const subjects = ["English", "Hindi", "Mathematics", "Science", "Social Science"];
      const randomClasses = CLASSES.slice(3, 8);
      assignedClasses = randomClasses.map(cls => ({
        className: cls,
        subject: subjects[Math.floor(Math.random() * subjects.length)]
      }));
    }
    
    if (assignedClasses.length > 0) {
      await Teacher.findByIdAndUpdate(teacher._id, { assignedClasses });
      console.log(`  ${teacherName}: ${assignedClasses.length} assignments`);
    }
  }
  
  console.log("\nTeacher assignments completed!");
}

async function generateTimetables() {
  console.log("\n=== Step 2: Generating Timetables for All Classes ===\n");
  
  await Timetable.deleteMany({});
  console.log("Cleared existing timetables");
  
  const teachers = await Teacher.find({});
  const academicYear = new Date().getFullYear().toString();
  
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
  
  let totalTimetables = 0;
  
  for (const className of CLASSES) {
    const subjects = CLASS_SUBJECTS[className] || [];
    
    for (const day of DAYS) {
      const periods = [];
      let subjectIndex = (day.id - 1) % subjects.length;
      let roomIndex = 0;
      
      for (let i = 0; i < PERIOD_TIMES.length; i++) {
        const timeSlot = PERIOD_TIMES[i];
        
        if (i === 2) {
          periods.push({
            periodNumber: i + 1,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            subject: "Break",
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
            teacherName: "",
            roomNumber: "",
            isBreak: true
          });
        } else {
          const subject = subjects[subjectIndex % subjects.length];
          
          const teacher = teachers.find(t => {
            const assignments = t.assignedClasses || [];
            return assignments.some(a => a.className === className && a.subject === subject);
          });
          
          const teacherName = teacher ? teacher.name : "TBA";
          const teacherId = teacher ? teacher._id : null;
          const room = ROOMS[roomIndex % ROOMS.length];
          
          periods.push({
            periodNumber: i + 1,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            subject: subject,
            teacherId: teacherId,
            teacherName: teacherName,
            roomNumber: room,
            isBreak: false
          });
          
          subjectIndex++;
          roomIndex++;
        }
      }
      
      const timetable = new Timetable({
        className,
        dayOfWeek: day.id,
        periods,
        academicYear
      });
      
      await timetable.save();
      totalTimetables++;
    }
    
    console.log(`  ${className}: ${DAYS.length} days created`);
  }
  
  console.log(`\nTotal timetables created: ${totalTimetables}`);
  console.log(`Classes: ${CLASSES.length}`);
  console.log(`Days per class: ${DAYS.length}`);
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("   SMART SCHOOL - COMPREHENSIVE SEED SCRIPT");
    console.log("   Assigns Teachers & Generates Timetables");
    console.log("=".repeat(60));
    
    await mongoose.connect(MONGO_URI);
    console.log("\nConnected to MongoDB");
    
    await assignTeachersToClasses();
    await generateTimetables();
    
    console.log("\n" + "=".repeat(60));
    console.log("   SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\nNext steps:");
    console.log("1. Restart your Next.js server");
    console.log("2. Login as Admin/Principal");
    console.log("3. Check Teacher Assignment page");
    console.log("4. Check Timetable Management page");
    console.log("5. Login as Student to see timetable");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

main();
