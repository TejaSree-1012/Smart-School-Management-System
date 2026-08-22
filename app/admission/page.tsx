"use client"

import { useState } from "react"
import styles from "../styles/admissionForm.module.css"
import Link from "next/link"
import { motion } from "framer-motion"

export default function AdmissionPage(){

const [step,setStep] = useState(1)



const [success,setSuccess] = useState(false)
const [selectedFile,setSelectedFile] = useState<File | null>(null)
const [photoPreview, setPhotoPreview] = useState<string>("")
const [loading, setLoading] = useState(false)

const [formData,setFormData] = useState({

studentName:"",
dob:"",
gender:"",
classApplying:"",

fatherName:"",
motherName:"",
phone:"",
email:"",

studentPhoto:""

})

function next(){

if(step===1){

if(
!formData.studentName ||
!formData.dob ||
!formData.gender ||
!formData.classApplying
){
alert("Please fill all student details")
return
}

}

if(step===2){

if(
!formData.fatherName ||
!formData.motherName ||
!formData.phone ||
!formData.email
){
alert("Please fill all parent details")
return
}

}

setStep(step+1)

}
const prev = ()=> setStep(step-1)

const handleChange = (e:any)=>{

setFormData({
...formData,
[e.target.name]:e.target.value
})

}

const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {

  const file = e.target.files?.[0]

  if (!file) return

  setSelectedFile(file)

  const previewURL = URL.createObjectURL(file)

  setPhotoPreview(previewURL)

}

async function handleSubmit(e:any){

  e.preventDefault()

  setLoading(true)

  try{

    const form = new FormData()

    form.append("studentName",formData.studentName)
    form.append("dob",formData.dob)
    form.append("gender",formData.gender)
    form.append("classApplying",formData.classApplying)

    form.append("fatherName",formData.fatherName)
    form.append("motherName",formData.motherName)

    form.append("phone",formData.phone)
    form.append("email",formData.email)

    if(selectedFile){
      form.append("photo",selectedFile)
    }

    const res = await fetch("/api/admission",{
      method:"POST",
      body:form
    })

    const data = await res.json()

    console.log("Server response:",data)

    setSuccess(true)

  }catch(error){

    console.error("Submission Error:",error)

    alert("Submission failed")

  }finally{

    setLoading(false)

  }

}

return(

<section className={styles.section}>

<Link href="/">
<button className={styles.back}>← Back to Home</button>
</Link>

<h1>School Admission Form</h1>

{/* PROGRESS BAR */}

<div className={styles.progress}>
<div style={{width: step===1?"33%":step===2?"66%":"100%"}}/>
</div>

<form className={styles.form} onSubmit={handleSubmit}>

{/* STEP 1 */}

{step===1 && (

<motion.div
initial={{opacity:0,x:50}}
animate={{opacity:1,x:0}}
transition={{duration:0.5}}
>

<h3>Student Details</h3>

<input
name="studentName"
placeholder="Student Name"
value={formData.studentName}
onChange={handleChange}
required
/>

<label>Enter Date of Birth</label>
<input
type="date"
name="dob"
value={formData.dob}
onChange={handleChange}
required
/>

<select
name="gender"
value={formData.gender}
onChange={handleChange}
required
>

<option value="">Select Gender</option>
<option value="Male">Male</option>
<option value="Female">Female</option>

</select>

<select
name="classApplying"
value={formData.classApplying}
onChange={handleChange}
required
>

<option value="">Select Class</option>

<option value="Class 1">Class 1</option>
<option value="Class 2">Class 2</option>
<option value="Class 3">Class 3</option>
<option value="Class 4">Class 4</option>
<option value="Class 5">Class 5</option>
<option value="Class 6">Class 6</option>
<option value="Class 7">Class 7</option>
<option value="Class 8">Class 8</option>
<option value="Class 9">Class 9</option>
<option value="Class 10">Class 10</option>

</select>

<button
type="button"
onClick={next}
className={styles.next}
>
Next
</button>

</motion.div>

)}

{/* STEP 2 */}

{step===2 && (

<motion.div
initial={{opacity:0,x:50}}
animate={{opacity:1,x:0}}
transition={{duration:0.5}}
>

<h3>Parent Details</h3>

<input
name="fatherName"
placeholder="Father Name"
value={formData.fatherName}
onChange={handleChange}
required
/>

<input
name="motherName"
placeholder="Mother Name"
value={formData.motherName}
onChange={handleChange}
required
/>

<input
name="phone"
placeholder="Phone Number"
value={formData.phone}
onChange={handleChange}
required
/>

<input
type="email"
name="email"
placeholder="Email Address"
value={formData.email}
onChange={handleChange}
required
/>

<div className={styles.buttons}>

<button type="button" onClick={prev}>
Back
</button>

<button type="button" onClick={next}>
Next
</button>

</div>

</motion.div>

)}

{/* STEP 3 */}

{step===3 && (

<motion.div
initial={{opacity:0,x:50}}
animate={{opacity:1,x:0}}
transition={{duration:0.5}}
>

<h3>Upload Student Passport Photo</h3>

<input
type="file"
accept="image/*"
onChange={handlePhoto}
required
/>

{photoPreview && (
<img
src={photoPreview}
className={styles.preview}
alt="Student Photo"
/>
)}

<div className={styles.buttons}>

<button type="button" onClick={prev}>
Back
</button>

<button type="submit" disabled={loading}>
{loading ? "Submitting..." : "Submit Application"}
</button>

</div>

</motion.div>

)}

</form>

{/* SUCCESS POPUP */}

{success && (

<div className={styles.popup}>

<motion.div
initial={{scale:0}}
animate={{scale:1}}
transition={{duration:0.5}}
className={styles.successCard}
>

<h2>🎉 Admission Submitted Successfully</h2>

<p>
Thank you for applying to Smart School.
Our admissions team will review your application shortly.
</p>

<Link href="/">
<button className={styles.homeBtn}>
Return Home
</button>
</Link>

</motion.div>

</div>

)}



</section>

)

}