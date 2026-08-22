const mongoose = require('mongoose');
require('dotenv').config();

const TimetableSchema = new mongoose.Schema({
  className: String,
  dayOfWeek: Number,
  academicYear: String,
  term: String,
  periods: [{
    periodNumber: Number,
    startTime: String,
    endTime: String,
    subject: String,
    teacherName: String,
    roomNumber: String,
    isBreak: Boolean
  }]
}, { timestamps: true });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);

const TEACHER_NAME = 'Priya Sharma';
const ACADEMIC_YEAR = '2025-2026';

const classes = ['Class 2', 'Class 3', 'Class 4'];
const days = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' }
];

const subjectsByClass = {
  'Class 2': ['Mathematics', 'English', 'Environmental Studies', 'Hindi', 'Art & Craft'],
  'Class 3': ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi'],
  'Class 4': ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer']
};

const roomsByClass = {
  'Class 2': 'Room 201',
  'Class 3': 'Room 202',
  'Class 4': 'Room 203'
};

function generatePeriods(className) {
  const subjects = subjectsByClass[className];
  return [
    { periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'Mathematics', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
    { periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'English', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
    { periodNumber: 3, startTime: '09:30', endTime: '09:45', subject: 'Break', teacherName: '', roomNumber: '', isBreak: true },
    { periodNumber: 4, startTime: '09:45', endTime: '10:30', subject: subjects[2] || 'Environmental Studies', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
    { periodNumber: 5, startTime: '10:30', endTime: '11:15', subject: 'Hindi', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
    { periodNumber: 6, startTime: '11:15', endTime: '12:00', subject: subjects[3] || 'Art', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
    { periodNumber: 7, startTime: '12:00', endTime: '12:45', subject: 'Lunch Break', teacherName: '', roomNumber: '', isBreak: true },
    { periodNumber: 8, startTime: '12:45', endTime: '13:30', subject: subjects[4] || 'Computer', teacherName: TEACHER_NAME, roomNumber: roomsByClass[className], isBreak: false },
  ];
}

async function seedTeacherTimetable() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school');
    console.log('Connected to MongoDB');

    await Timetable.deleteMany({
      className: { $in: classes },
      academicYear: ACADEMIC_YEAR
    });
    console.log('Cleared existing timetables for Classes 2, 3, 4');

    let created = 0;
    
    for (const className of classes) {
      for (const day of days) {
        const timetable = new Timetable({
          className,
          dayOfWeek: day.id,
          academicYear: ACADEMIC_YEAR,
          term: 'Full Year',
          periods: generatePeriods(className)
        });
        
        await timetable.save();
        created++;
        console.log(`Created: ${className} - ${day.name}`);
      }
    }

    console.log(`\nSuccessfully created ${created} timetable entries!`);
    console.log(`Teacher: ${TEACHER_NAME}`);
    console.log(`Classes: ${classes.join(', ')}`);
    console.log(`Days: ${days.map(d => d.name).join(', ')}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedTeacherTimetable();
