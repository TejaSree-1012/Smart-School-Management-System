import { NextResponse } from "next/server"
import connectDB from "@/app/lib/mongodb"

import Admin from "@/app/models/Admin"
import Teacher from "@/app/models/Teacher"
import Principal from "@/app/models/Principal"
import Student from "@/app/models/Student"
import Parent from "@/app/models/Parent"
import bcrypt from "bcryptjs"

import { generateToken } from "@/app/lib/jwt"

export async function POST(req: Request) {

 try{

  await connectDB()

  const body = await req.json()

  const { email,password,role,studentId,dob,phone } = body

  let user:any = null


  if(role==="admin"){
   const admin = await Admin.findOne({email})

if(admin){

 const match = await bcrypt.compare(password,admin.password)

 if(match){
  user = admin
 }

}
  }

   else if(role==="teacher"){
    console.log("Teacher login attempt for:", email)
    const teacher = await Teacher.findOne({email})
    console.log("Teacher found:", teacher ? "yes" : "no")
    
    if(teacher){
      let match = await bcrypt.compare(password, teacher.password)
      if(!match && teacher.password === password){
        match = true
      }
      console.log("Password match:", match)
      if(match){
        user = teacher
      }
    }
   }

  else if(role==="principal"){
   const principal = await Principal.findOne({email})

if(principal){

 const match = await bcrypt.compare(password,principal.password)

 if(match){
  user = principal
 }

}
  }

  else if(role==="student"){
    user = await Student.findOne({studentId,dob})
   }

else if(role==="parent"){
     // Parent login uses student's phone + studentId to find corresponding student
     const student = await Student.findOne({ 
       studentId: new RegExp(`^${studentId}$`, 'i'),
       phone: phone 
     });
     
     if (student) {
       user = {
         _id: student._id,
         name: student.fatherName || "Parent",
         email: student.email,
         phone: student.phone,
         studentId: student.studentId
       };
     }
   }


  if(!user){
    return NextResponse.json(
     {success:false,message:"Invalid email or password"},
     {status:401}
    )
   }


   // IMPORTANT FIX
   const token = await generateToken({
  id: user._id.toString(),
  role: role
})


  const response = NextResponse.json({
   success:true,
   redirect:`/${role}/dashboard`
  })


  response.cookies.set({
   name:"token",
   value:token,
   httpOnly:true,
   sameSite:"lax",
   path:"/",
   secure:false,
   maxAge:60*60*24
  })


  return response

 }

  catch(error){

   console.log("LOGIN ERROR:",error)

   return NextResponse.json(
    {success:false, message:"Server error. Please try again."},
    {status:500}
   )

  }

}