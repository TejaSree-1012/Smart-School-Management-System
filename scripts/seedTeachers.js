const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_school";

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  password: String,
  phone: String,
  qualification: String,
  specialization: String,
  experience: Number,
  department: String,
  designation: String,
  joiningDate: Date,
  isActive: Boolean,
  assignedClasses: [{
    className: String,
    subject: String
  }],
  role: { type: String, default: "teacher" }
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);

const TEACHERS = [
  {
    name: "Priya Sharma",
    email: "priya.sharma@smartschool.com",
    password: "teacher123",
    phone: "9876543210",
    qualification: "M.A. English, B.Ed.",
    specialization: "English Literature",
    experience: 8,
    department: "Secondary Wing",
    designation: "Senior Teacher"
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@smartschool.com",
    password: "teacher123",
    phone: "9876543211",
    qualification: "M.Sc. Mathematics, B.Ed.",
    specialization: "Mathematics",
    experience: 12,
    department: "Secondary Wing",
    designation: "Head of Department"
  },
  {
    name: "Sunita Devi",
    email: "sunita.devi@smartschool.com",
    password: "teacher123",
    phone: "9876543212",
    qualification: "M.A. Hindi, B.Ed.",
    specialization: "Hindi Language",
    experience: 10,
    department: "Primary Wing",
    designation: "Senior Teacher"
  },
  {
    name: "Anita Gupta",
    email: "anita.gupta@smartschool.com",
    password: "teacher123",
    phone: "9876543213",
    qualification: "M.A. History, B.Ed.",
    specialization: "Social Science",
    experience: 7,
    department: "Secondary Wing",
    designation: "Teacher"
  },
  {
    name: "Dr. Amit Verma",
    email: "amit.verma@smartschool.com",
    password: "teacher123",
    phone: "9876543214",
    qualification: "M.Sc. Physics, Ph.D., B.Ed.",
    specialization: "Science",
    experience: 15,
    department: "Secondary Wing",
    designation: "Senior Scientist Teacher"
  },
  {
    name: "Meera Singh",
    email: "meera.singh@smartschool.com",
    password: "teacher123",
    phone: "9876543215",
    qualification: "M.F.A., B.Ed.",
    specialization: "Art & Craft",
    experience: 6,
    department: "Primary Wing",
    designation: "Art Teacher"
  },
  {
    name: "Vikram Yadav",
    email: "vikram.yadav@smartschool.com",
    password: "teacher123",
    phone: "9876543216",
    qualification: "M.P.Ed.",
    specialization: "Physical Education",
    experience: 9,
    department: "Sports",
    designation: "Physical Education Teacher"
  },
  {
    name: "Geeta Joshi",
    email: "geeta.joshi@smartschool.com",
    password: "teacher123",
    phone: "9876543217",
    qualification: "M.A. Music, B.Ed.",
    specialization: "Music",
    experience: 5,
    department: "Arts",
    designation: "Music Teacher"
  },
  {
    name: "Rahul Mishra",
    email: "rahul.mishra@smartschool.com",
    password: "teacher123",
    phone: "9876543218",
    qualification: "M.C.A., B.Ed.",
    specialization: "Computer Science",
    experience: 4,
    department: "Computer Science",
    designation: "Computer Teacher"
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor@smartschool.com",
    password: "teacher123",
    phone: "9876543219",
    qualification: "M.A. Sanskrit, B.Ed.",
    specialization: "Sanskrit",
    experience: 3,
    department: "Languages",
    designation: "Sanskrit Teacher"
  },
  {
    name: "Suresh Patel",
    email: "suresh.patel@smartschool.com",
    password: "teacher123",
    phone: "9876543220",
    qualification: "M.Sc. Chemistry, B.Ed.",
    specialization: "Science",
    experience: 11,
    department: "Secondary Wing",
    designation: "Science Teacher"
  },
  {
    name: "Kavita Rao",
    email: "kavita.rao@smartschool.com",
    password: "teacher123",
    phone: "9876543221",
    qualification: "M.Sc. Biology, B.Ed.",
    specialization: "Biology",
    experience: 8,
    department: "Secondary Wing",
    designation: "Biology Teacher"
  }
];

async function seedTeachers() {
  try {
    console.log("=".repeat(60));
    console.log("   SMART SCHOOL - TEACHER SEED SCRIPT");
    console.log("=".repeat(60));
    
    await mongoose.connect(MONGO_URI);
    console.log("\nConnected to MongoDB");
    
    await Teacher.deleteMany({});
    console.log("Cleared existing teachers");
    
    const hashedPassword = await bcrypt.hash("teacher123", 10);
    const currentYear = new Date().getFullYear();
    
    let createdCount = 0;
    
    for (let i = 0; i < TEACHERS.length; i++) {
      const teacher = TEACHERS[i];
      const teacherId = `TCH${currentYear}${String(i + 1).padStart(4, "0")}`;
      
      const newTeacher = new Teacher({
        ...teacher,
        teacherId,
        password: hashedPassword,
        joiningDate: new Date(currentYear, 3, 1),
        isActive: true
      });
      
      await newTeacher.save();
      console.log(`  Created: ${teacher.name} (${teacherId})`);
      createdCount++;
    }
    
    console.log(`\nTotal teachers created: ${createdCount}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("   LOGIN CREDENTIALS FOR ALL TEACHERS");
    console.log("=".repeat(60));
    console.log("\nEmail: [name]@smartschool.com");
    console.log("Password: teacher123");
    console.log("\nExample:");
    console.log("  Email: priya.sharma@smartschool.com");
    console.log("  Password: teacher123");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

seedTeachers();
