"use client";

import { useEffect, useState } from "react";
import { 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaUser,
  FaTimes
} from "react-icons/fa";
import styles from "@/app/styles/Overview.module.css";

interface StudentData {
  studentId: string;
  studentName: string;
  email?: string;
  fatherName?: string;
  classApplying?: string;
  stats: {
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
}

interface AttendanceDay {
  _id: string;
  studentId: string;
  date: string;
  status: string;
  teacherName?: string;
}

interface StudentStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

interface MonthlyStats {
  month: number;
  year: number;
  monthName: string;
  daysInMonth: number;
  firstDayOfMonth: number;
  presentDays: number;
  absentDays: number;
  totalRecords: number;
}

const CLASSES = [
  "Select Class", "Nursery", "LKG", "UKG", 
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedClass, setSelectedClass] = useState("Select Class");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceDay>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent.studentId);
    }
  }, [selectedStudent, currentMonth, currentYear]);

  useEffect(() => {
    if (studentStats) {
      const duration = 1000;
      const steps = 40;
      const target = studentStats.attendancePercentage;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedPercentage(target);
          clearInterval(timer);
        } else {
          setAnimatedPercentage(Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [studentStats?.attendancePercentage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = selectedClass === "Select Class" 
        ? "/api/admin/dashboard/attendance" 
        : `/api/admin/dashboard/attendance?class=${encodeURIComponent(selectedClass)}`;
        
      const res = await fetch(url, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (studentId: string) => {
    try {
      const res = await fetch(`/api/admin/students/attendance?studentId=${studentId}&month=${currentMonth}&year=${currentYear}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStudentStats(data.stats);
        setMonthlyStats(data.monthlyStats);
        setAttendanceByDate(data.attendance || {});
      }
    } catch (error) {
      console.error("Error fetching student attendance:", error);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.classApplying || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" };
    if (percentage >= 75) return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
    return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
  };

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    else if (newMonth < 0) { newMonth = 11; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderCalendar = () => {
    if (!monthlyStats) return null;
    
    const daysInMonth = monthlyStats.daysInMonth;
    const firstDayOfMonth = monthlyStats.firstDayOfMonth;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} style={{ aspectRatio: "1" }}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceByDate[dateStr];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      let bgColor = "#f8fafc";
      let status = "";
      
      if (attendance) {
        if (attendance.status === "present") {
          bgColor = "rgba(34, 197, 94, 0.15)";
          status = "P";
        } else if (attendance.status === "absent") {
          bgColor = "rgba(239, 68, 68, 0.15)";
          status = "A";
        } else if (attendance.status === "late") {
          bgColor = "rgba(245, 158, 11, 0.15)";
          status = "L";
        }
      }
      
      if (isToday && !attendance) {
        bgColor = "rgba(59, 130, 246, 0.1)";
      }
      
      days.push(
        <div 
          key={day} 
          style={{ 
            aspectRatio: "1",
            borderRadius: "10px",
            background: bgColor,
            border: isToday ? "2px solid #3b82f6" : "2px solid transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "default",
            transition: "all 0.2s ease"
          }}
          title={attendance ? `${attendance.status}${attendance.teacherName ? ` - ${attendance.teacherName}` : ''}` : "No record"}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{day}</span>
          {status && (
            <span style={{ 
              fontSize: "9px", 
              fontWeight: 700, 
              color: attendance.status === "present" ? "#16a34a" : attendance.status === "absent" ? "#dc2626" : "#d97706"
            }}>
              {status}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button 
            onClick={() => changeMonth(-1)}
            style={{
              width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <FaChevronLeft style={{ fontSize: "12px", color: "#64748b" }} />
          </button>
          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            {monthlyStats.monthName} {currentYear}
          </h4>
          <button 
            onClick={() => changeMonth(1)}
            disabled={currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()}
            style={{
              width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              opacity: currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear() ? 0.5 : 1
            }}
          >
            <FaChevronRight style={{ fontSize: "12px", color: "#64748b" }} />
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {dayNames.map(day => (
            <div key={day} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#64748b", padding: "8px 0" }}>
              {day}
            </div>
          ))}
          {days}
        </div>
        
        <div style={{ display: "flex", gap: "16px", marginTop: "16px", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.3)" }}></span>
            Present
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.3)" }}></span>
            Absent
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.3)" }}></span>
            Late
          </div>
        </div>
      </div>
    );
  };

  if (selectedStudent && studentStats) {
    const percentageColors = getPercentageColor(studentStats.attendancePercentage);
    
    return (
      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <button 
              onClick={() => {
                setSelectedStudent(null);
                setStudentStats(null);
                setMonthlyStats(null);
                setAttendanceByDate({});
              }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0",
                borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#64748b",
                cursor: "pointer"
              }}
            >
              <FaChevronLeft /> Back to Students
            </button>
            <h2 className={styles.sectionTitle}>{selectedStudent.studentName} - Attendance Details</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>
            <div>
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #e2e8f0",
                textAlign: "center"
              }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", color: "#fff", fontSize: "28px", fontWeight: 700
                }}>
                  {getInitials(selectedStudent.studentName)}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
                  {selectedStudent.studentName}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0" }}>
                  {selectedStudent.classApplying}
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 20px 0" }}>
                  ID: {selectedStudent.studentId}
                </p>

                <div style={{ position: "relative", width: "150px", height: "150px", margin: "0 auto 20px" }}>
                  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke={percentageColors.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(animatedPercentage / 100) * 283} 283`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, color: percentageColors.color, display: "block" }}>
                      {animatedPercentage}%
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>Attendance</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-around", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e", margin: "0" }}>
                      {studentStats.presentDays}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>Present</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444", margin: "0" }}>
                      {studentStats.absentDays}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>Absent</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6", margin: "0" }}>
                      {studentStats.totalWorkingDays}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>Working Days</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid #e2e8f0"
            }}>
              <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCalendarAlt style={{ color: "#3b82f6" }} />
                Monthly Attendance Calendar
              </h4>
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaUserGraduate style={{ marginRight: "8px", color: "#3b82f6" }} />
            Student Attendance
          </h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <FaFilter style={{ color: "#64748b" }} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1e293b",
                background: "#ffffff",
                cursor: "pointer"
              }}
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  width: "200px",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUserGraduate className={styles.emptyIcon} />
            <p>No students found</p>
          </div>
        ) : (
          <div className={styles.admissionList}>
            {filteredStudents.map((student, index) => {
              const colors = getPercentageColor(student.stats.attendancePercentage);
              return (
                <div 
                  key={student.studentId}
                  className={styles.admissionCard}
                  style={{ animationDelay: `${index * 30}ms`, cursor: "pointer" }}
                  onClick={() => {
                    setSelectedStudent(student);
                    setAnimatedPercentage(0);
                  }}
                >
                  <div className={styles.admissionIcon} style={{ background: colors.bg }}>
                    <FaUser style={{ color: colors.color }} />
                  </div>
                  <div className={styles.admissionInfo}>
                    <h3>{student.studentName}</h3>
                    <p>ID: {student.studentId} | {student.classApplying}</p>
                  </div>
                  <div className={styles.admissionMeta}>
                    <div style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: 700,
                      background: colors.bg,
                      color: colors.color
                    }}>
                      {student.stats.attendancePercentage}%
                    </div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaCheckCircle style={{ color: "#22c55e", fontSize: "11px" }} />
                        {student.stats.presentDays} P
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaTimesCircle style={{ color: "#ef4444", fontSize: "11px" }} />
                        {student.stats.absentDays} A
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaCalendarAlt style={{ color: "#3b82f6", fontSize: "11px" }} />
                        {student.stats.totalWorkingDays} Days
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
