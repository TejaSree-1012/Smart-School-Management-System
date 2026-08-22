import {NextResponse} from "next/server"
import connectDB from "@/app/lib/mongodb"
import Teacher from "@/app/models/Teacher"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { requireAdmin } from "@/app/lib/auth"

async function sendTeacherCredentials(email: string, name: string, password: string, teacherId: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
          .credentials h3 { margin-top: 0; color: #22c55e; }
          .credentials p { margin: 8px 0; }
          .credentials strong { color: #1e3a5f; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Smart School System</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Greetings from Smart School! We are pleased to inform you that your teacher account has been created successfully.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <p><strong>Teacher ID:</strong> ${teacherId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <p>Please login to the teacher portal and change your password after first login.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login/teacher" class="btn">Login Now</a>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Smart School System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: `"Smart School System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Smart School - Your Teacher Login Credentials",
      html: htmlContent
    })

    console.log("Teacher credentials email sent to:", email)
    return true
  } catch (error) {
    console.error("Failed to send teacher credentials email:", error)
    return false
  }
}

function generateTeacherId() {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `TCH-${year}-${random}`
}

export async function GET(){
  await connectDB()

  const teachers = await Teacher.find().sort({ createdAt: -1 }).lean()

  const teachersWithStringId = teachers.map(t => ({
    ...t,
    _id: t._id.toString()
  }))

  return NextResponse.json(teachersWithStringId)
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    await connectDB()

    const body = await req.json()
    const { 
      name, email, password, phone, alternatePhone, gender, dateOfBirth,
      qualification, specialization, experience, department, designation,
      joiningDate, address, city, state, pincode, aadharCard, panCard,
      emergencyContact, bankAccount, salary, assignedClasses, sendCredentials,
      notes
    } = body

    if(!name || !email || !password){
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      )
    }

    const existingTeacher = await Teacher.findOne({ email })
    if(existingTeacher){
      return NextResponse.json(
        { message: "Teacher with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    let teacherId = generateTeacherId()
    const existingWithId = await Teacher.findOne({ teacherId })
    while (existingWithId) {
      teacherId = generateTeacherId()
    }

    const teacher = await Teacher.create({
      teacherId,
      name,
      email,
      password: hashedPassword,
      phone,
      alternatePhone,
      gender,
      dateOfBirth,
      qualification,
      specialization,
      experience: experience || 0,
      department,
      designation: designation || "Teacher",
      joiningDate,
      address,
      city,
      state,
      pincode,
      aadharCard,
      panCard,
      emergencyContact,
      bankAccount,
      salary,
      assignedClasses: assignedClasses || [],
      sendCredentials,
      notes,
      role: "teacher",
      isActive: true
    })

    if (sendCredentials && email && password) {
      await sendTeacherCredentials(email, name, password, teacherId)
    }

    const teacherResponse = teacher.toObject()
    delete teacherResponse.password

    return NextResponse.json(teacherResponse, { status: 201 })
  } catch (error: any) {
    console.error("Create teacher error:", error)
    return NextResponse.json(
      { message: error.message || "Failed to create teacher" },
      { status: 500 }
    )
  }
}
