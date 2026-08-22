const mongoose = require('mongoose');
require('dotenv').config();

const TeacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  qualification: { type: String },
  specialization: { type: String },
  experience: { type: Number },
  department: { type: String },
  designation: { type: String },
  joiningDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);

async function seedTeacher() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school');
    console.log('Connected to MongoDB');

    await Teacher.deleteOne({ teacherId: 'TCH250001' });
    console.log('Cleared existing teacher with ID TCH250001');

    const teacher = new Teacher({
      teacherId: 'TCH250001',
      name: 'Priya Sharma',
      email: 'priya.sharma@smartschool.com',
      password: '$2a$10$8K1p/a0dR1xqM8K9Q6Y5aOQqQqQqQqQqQqQqQqQqQqQqQqQqQqQq', // Will need to be rehashed on login
      phone: '9876543210',
      qualification: 'M.A., B.Ed.',
      specialization: 'Mathematics & Science',
      experience: 8,
      department: 'Primary Wing',
      designation: 'Senior Teacher',
      joiningDate: new Date('2020-06-15'),
      isActive: true
    });

    await teacher.save();
    console.log('Created Teacher: Priya Sharma');
    console.log('Teacher ID: TCH250001');
    console.log('Email: priya.sharma@smartschool.com');
    console.log('\nNote: Please update the password in database using the login endpoint to generate proper hash');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedTeacher();
