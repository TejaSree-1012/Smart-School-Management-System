const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_school";

const StudentSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  dob: String,
  gender: String,
  classApplying: String,
  fatherName: String,
  motherName: String,
  phone: String,
  email: String,
  status: String,
  role: { type: String, default: "student" }
}, { timestamps: true });

const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);

const STUDENTS = [
  { studentName: "Arjun Verma", classApplying: "Class 1", gender: "Male", fatherName: "Vikram Verma", motherName: "Priya Verma" },
  { studentName: "Ananya Patel", classApplying: "Class 1", gender: "Female", fatherName: "Raj Patel", motherName: "Meena Patel" },
  { studentName: "Rohan Sharma", classApplying: "Class 2", gender: "Male", fatherName: "Anil Sharma", motherName: "Sunita Sharma" },
  { studentName: "Diya Gupta", classApplying: "Class 2", gender: "Female", fatherName: "Rakesh Gupta", motherName: "Neha Gupta" },
  { studentName: "Aryan Kumar", classApplying: "Class 3", gender: "Male", fatherName: "Suresh Kumar", motherName: " Kavita Kumar" },
  { studentName: "Ishita Singh", classApplying: "Class 3", gender: "Female", fatherName: "Vikram Singh", motherName: "Geeta Singh" },
  { studentName: "Vivaan Reddy", classApplying: "Class 4", gender: "Male", fatherName: "Ravi Reddy", motherName: "Lakshmi Reddy" },
  { studentName: "Myra Kapoor", classApplying: "Class 4", gender: "Female", fatherName: "Ajay Kapoor", motherName: "Sonia Kapoor" },
  { studentName: "Aditya Joshi", classApplying: "Class 5", gender: "Male", fatherName: "Mohan Joshi", motherName: "Anju Joshi" },
  { studentName: "Anika Mehta", classApplying: "Class 5", gender: "Female", fatherName: "Deepak Mehta", motherName: "Ritu Mehta" },
  { studentName: "Kabir Malhotra", classApplying: "Class 6", gender: "Male", fatherName: "Arun Malhotra", motherName: "Pooja Malhotra" },
  { studentName: "Navya Nair", classApplying: "Class 6", gender: "Female", fatherName: "Sanjay Nair", motherName: "Meera Nair" },
  { studentName: "Ritvik Iyer", classApplying: "Class 7", gender: "Male", fatherName: "Gopal Iyer", motherName: "Lalitha Iyer" },
  { studentName: "Saanvi Rao", classApplying: "Class 7", gender: "Female", fatherName: "Krishna Rao", motherName: "Padma Rao" },
  { studentName: "Veer Oberoi", classApplying: "Class 8", gender: "Male", fatherName: "Vijay Oberoi", motherName: "Rani Oberoi" },
  { studentName: "Aadhya Bansal", classApplying: "Class 8", gender: "Female", fatherName: "Ramesh Bansal", motherName: "Neeta Bansal" },
  { studentName: "Rudra Khanna", classApplying: "Class 9", gender: "Male", fatherName: "Sanjay Khanna", motherName: "Arti Khanna" },
  { studentName: "Ananya Mishra", classApplying: "Class 9", gender: "Female", fatherName: "Prakash Mishra", motherName: "Sunita Mishra" },
  { studentName: "Ishaan Saxena", classApplying: "Class 10", gender: "Male", fatherName: "Ashok Saxena", motherName: "Kavita Saxena" },
  { studentName: "Myra Agarwal", classApplying: "Class 10", gender: "Female", fatherName: "Vikram Agarwal", motherName: "Sarita Agarwal" },
];

async function seedStudents() {
  try {
    console.log("=".repeat(60));
    console.log("   SMART SCHOOL - STUDENT SEED SCRIPT");
    console.log("=".repeat(60));
    
    await mongoose.connect(MONGO_URI);
    console.log("\nConnected to MongoDB");
    
    await Student.deleteMany({});
    console.log("Cleared existing students");
    
    const hashedPassword = await bcrypt.hash("student123", 10);
    const currentYear = new Date().getFullYear();
    
    let createdCount = 0;
    
    for (let i = 0; i < STUDENTS.length; i++) {
      const student = STUDENTS[i];
      const studentId = `STU250${String(i + 1).padStart(3, "0")}`;
      
      const newStudent = new Student({
        ...student,
        studentId,
        dob: "2015-01-15",
        phone: `9876543${String(i + 100).padStart(3, "0")}`,
        email: student.studentName.toLowerCase().replace(" ", ".") + "@student.com",
        status: "active",
        source: "seed"
      });
      
      await newStudent.save();
      console.log(`  Created: ${student.studentName} (${studentId}) - ${student.classApplying}`);
      createdCount++;
    }
    
    console.log(`\nTotal students created: ${createdCount}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("   LOGIN CREDENTIALS FOR ALL STUDENTS");
    console.log("=".repeat(60));
    console.log("\nLogin with: Student ID + Date of Birth");
    console.log("DOB for all students: 2015-01-15");
    console.log("\nExamples:");
    console.log("  Student ID: STU250001  |  DOB: 2015-01-15");
    console.log("  Student ID: STU250005  |  DOB: 2015-01-15");
    console.log("  Student ID: STU250011  |  DOB: 2015-01-15");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

seedStudents();
