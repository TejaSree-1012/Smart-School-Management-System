"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "@/app/styles/StudentAttendance.module.css";
import { 
  FaClipboardCheck,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaUser,
  FaExclamationTriangle
} from "react-icons/fa";

type AttendanceRecord = {
  _id: string;
  studentId: string;
  date: string;
  status: string;
  teacherName?: string;
  remarks?: string;
};

type Stats = {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  markedDays: number;
  attendancePercentage: number;
};

type MonthlyStats = {
  month: number;
  year: number;
  monthName: string;
  daysInMonth: number;
  firstDayOfMonth: number;
  presentDays: number;
  absentDays: number;
  totalRecords: number;
};

export default function StudentAttendance() {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [studentClass, setStudentClass] = useState("Class 1");
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [absentDates, setAbsentDates] = useState<string[]>([]);
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceRecord>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
    fetchAttendance();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (stats) {
      const duration = 1500;
      const steps = 60;
      const increment = stats.attendancePercentage / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= stats.attendancePercentage) {
          setAnimatedPercentage(stats.attendancePercentage);
          clearInterval(timer);
        } else {
          setAnimatedPercentage(Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [stats?.attendancePercentage]);

  async function fetchStudentData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setStudentName(data.user.name || "Student");
          setStudentClass(data.user.class || "Class 1");
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  }

  async function fetchAttendance() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/students/attendance?month=${currentMonth}&year=${currentYear}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view attendance");
        } else if (res.status === 404) {
          setError("Student not found");
        } else {
          setError("Failed to load attendance data");
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      
      setStats(data.stats);
      setMonthlyStats(data.monthlyStats);
      setAbsentDates(data.absentDates || []);
      setAttendanceByDate(data.attendance || {});
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", text: "#22c55e" };
    if (percentage >= 75) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", text: "#f59e0b" };
    return { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", text: "#ef4444" };
  };

  const getPercentageMessage = (percentage: number) => {
    if (percentage >= 95) return "Excellent Attendance! Keep it up!";
    if (percentage >= 90) return "Great Attendance! Keep it up!";
    if (percentage >= 75) return "Good Attendance, but room for improvement";
    if (percentage >= 60) return "Attendance needs attention";
    return "Critical: Attendance is below required level";
  };

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const renderCalendar = () => {
    if (!monthlyStats) return null;

    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < monthlyStats.firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty}></div>);
    }
    
    for (let day = 1; day <= monthlyStats.daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceByDate[dateStr];
      const isAbsent = absentDates.includes(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      let dayClass = styles.calendarDay;
      let statusText = "";
      let statusClass = "";
      
      if (attendance) {
        if (attendance.status === "present") {
          dayClass = `${styles.calendarDay} ${styles.present}`;
          statusText = "P";
          statusClass = styles.presentBadge;
        } else if (attendance.status === "late") {
          dayClass = `${styles.calendarDay} ${styles.late}`;
          statusText = "L";
          statusClass = styles.lateBadge;
        } else if (attendance.status === "absent") {
          dayClass = `${styles.calendarDay} ${styles.absent}`;
          statusText = "A";
          statusClass = styles.absentBadge;
        } else if (attendance.status === "excused") {
          dayClass = `${styles.calendarDay} ${styles.excused}`;
          statusText = "E";
          statusClass = styles.excusedBadge;
        }
      }
      
      if (isToday) {
        dayClass = `${dayClass} ${styles.today}`;
      }
      
      days.push(
        <div key={day} className={dayClass} title={attendance ? `${attendance.status}${attendance.teacherName ? ` - ${attendance.teacherName}` : ''}` : "No record"}>
          <span className={styles.dayNumber}>{day}</span>
          {statusText && <span className={`${styles.statusBadge} ${statusClass}`}>{statusText}</span>}
        </div>
      );
    }
    
    return (
      <div className={styles.calendarGrid}>
        {dayNames.map(day => (
          <div key={day} className={styles.calendarHeader}>{day}</div>
        ))}
        {days}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading your attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerCard}>
            <div className={styles.headerLeft}>
              <div className={styles.breadcrumb}>
                <FaHome className={styles.breadcrumbIcon} />
                <span>Student Portal</span>
              </div>
              <h1 className={styles.title}>My Attendance Record</h1>
              <p className={styles.subtitle}>Track your attendance and stay informed</p>
            </div>
          </div>
        </motion.div>
        <div className={styles.errorContainer}>
          <FaExclamationTriangle style={{ fontSize: "48px", color: "#ef4444", marginBottom: "16px" }} />
          <h2>Error Loading Attendance</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <motion.div 
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerCard}>
            <div className={styles.headerLeft}>
              <div className={styles.breadcrumb}>
                <FaHome className={styles.breadcrumbIcon} />
                <span>Student Portal</span>
              </div>
              <h1 className={styles.title}>My Attendance Record</h1>
              <p className={styles.subtitle}>Track your attendance and stay informed</p>
            </div>
          </div>
        </motion.div>
        <div className={styles.emptyContainer}>
          <FaClipboardCheck style={{ fontSize: "64px", color: "#e2e8f0", marginBottom: "16px" }} />
          <h2>No Attendance Data</h2>
          <p>Your attendance records will appear here once marked by your teacher.</p>
        </div>
      </div>
    );
  }

  const percentageColors = stats ? getPercentageColor(stats.attendancePercentage) : { bg: "#e2e8f0", text: "#64748b" };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.pageHeader}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <FaHome className={styles.breadcrumbIcon} />
              <span>Student Portal</span>
            </div>
            <h1 className={styles.title}>My Attendance Record</h1>
            <p className={styles.subtitle}>Track your attendance and stay informed</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.dateTimeBox}>
              <div className={styles.dateBox}>
                <FaCalendarAlt className={styles.dateIcon} />
                <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {stats && stats.attendancePercentage < 75 && (
        <motion.div 
          className={styles.warningBanner}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaExclamationTriangle />
          <span>{getPercentageMessage(stats.attendancePercentage)}. Please maintain minimum 75% attendance.</span>
        </motion.div>
      )}

      <div className={styles.contentGrid}>
        <motion.div 
          className={styles.statsSection}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.percentageCard}>
            <div className={styles.percentageHeader}>
              <div className={styles.percentageIcon}>
                <FaChartLine />
              </div>
              <h2>Attendance Percentage</h2>
            </div>
            
            <div className={styles.percentageDisplay}>
              <div className={styles.percentageCircle}>
                <svg viewBox="0 0 100 100" className={styles.percentageSvg}>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={percentageColors.text}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(animatedPercentage / 100) * 283} 283`}
                    transform="rotate(-90 50 50)"
                    className={styles.percentageProgress}
                  />
                </svg>
                <div className={styles.percentageValue}>
                  <span className={styles.percentageNumber} style={{ color: percentageColors.text }}>
                    {animatedPercentage}%
                  </span>
                  <span className={styles.percentageLabel}>Overall</span>
                </div>
              </div>
              
              <p className={styles.percentageMessage} style={{ color: percentageColors.text }}>
                {getPercentageMessage(stats?.attendancePercentage || 0)}
              </p>
            </div>

            <div className={styles.percentageStats}>
              <div className={styles.miniStat}>
                <FaCheckCircle style={{ color: "#22c55e" }} />
                <span>Present: <strong>{stats?.presentDays || 0}</strong></span>
              </div>
              <div className={styles.miniStat}>
                <FaTimesCircle style={{ color: "#ef4444" }} />
                <span>Absent: <strong>{stats?.absentDays || 0}</strong></span>
              </div>
              <div className={styles.miniStat}>
                <FaCalendarAlt style={{ color: "#3b82f6" }} />
                <span>Working Days: <strong>{stats?.totalWorkingDays || 0}</strong></span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={styles.statsSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.green}`}>
                <FaCheckCircle />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Present Days</p>
                <p className={styles.summaryValue}>{stats?.presentDays || 0}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.red}`}>
                <FaTimesCircle />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Absent Days</p>
                <p className={styles.summaryValue}>{stats?.absentDays || 0}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.blue}`}>
                <FaClipboardCheck />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Working Days</p>
                <p className={styles.summaryValue}>{stats?.totalWorkingDays || 0}</p>
              </div>
            </div>
          </div>

          <div className={styles.studentInfo}>
            <div className={styles.studentAvatar}>
              <FaUser />
            </div>
            <div className={styles.studentDetails}>
              <h3>{studentName}</h3>
              <p>{studentClass}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className={styles.calendarSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={`${styles.sectionIcon} ${styles.green}`}>
                <FaCalendarAlt />
              </div>
              <div className={styles.sectionInfo}>
                <h2>Monthly Attendance Calendar</h2>
                <p>{monthlyStats?.monthName} {currentYear}</p>
              </div>
            </div>
            
            <div className={styles.monthNavigation}>
              <button onClick={() => changeMonth(-1)} className={styles.navBtn}>
                <FaChevronLeft />
              </button>
              <span className={styles.currentMonth}>{monthlyStats?.monthName} {currentYear}</span>
              <button 
                onClick={() => changeMonth(1)} 
                className={styles.navBtn}
                disabled={currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className={styles.calendarLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.presentLegend}`}></span>
              <span>Present</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.lateLegend}`}></span>
              <span>Late</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.absentLegend}`}></span>
              <span>Absent</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.excusedLegend}`}></span>
              <span>Excused</span>
            </div>
          </div>

          {renderCalendar()}

          {monthlyStats && (
            <div className={styles.monthSummary}>
              <div className={styles.monthSummaryItem}>
                <span>This Month:</span>
                <strong>{monthlyStats.presentDays} Present</strong>
              </div>
              <div className={styles.monthSummaryItem}>
                <span>Absent:</span>
                <strong style={{ color: monthlyStats.absentDays > 0 ? "#ef4444" : "#22c55e" }}>
                  {monthlyStats.absentDays}
                </strong>
              </div>
              <div className={styles.monthSummaryItem}>
                <span>Total Records:</span>
                <strong>{monthlyStats.totalRecords}</strong>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {absentDates.length > 0 && (
        <motion.div 
          className={styles.absentSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <div className={`${styles.sectionIcon} ${styles.red}`}>
                  <FaTimesCircle />
                </div>
                <div className={styles.sectionInfo}>
                  <h2>Absent Days This Month</h2>
                  <p>{absentDates.length} day{absentDates.length !== 1 ? 's' : ''} marked absent</p>
                </div>
              </div>
            </div>

            <div className={styles.absentDaysList}>
              {absentDates.map((date) => (
                <motion.div 
                  key={date} 
                  className={styles.absentDayItem}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className={styles.absentDate}>
                    <FaCalendarAlt />
                    <span>{new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                  </div>
                  <span className={styles.absentBadge}>Absent</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
