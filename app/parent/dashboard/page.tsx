"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaClock,
  FaDoorOpen,
  FaUser,
  FaChartLine,
  FaClipboardCheck,
  FaHome,
  FaSignOutAlt,
  FaMedal,
  FaStar,
  FaTrophy,
  FaBell
} from "react-icons/fa";
import NotificationBell from "@/app/components/admin/NotificationBell";
import styles from "@/app/styles/StudentDashboard.module.css";

interface Period {
  _id?: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  roomNumber: string;
  isBreak: boolean;
}

interface Timetable {
  _id: string;
  className: string;
  dayOfWeek: number;
  academicYear: string;
  periods: Period[];
}

interface StudentStats {
  attendancePercentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalMarks: number;
  averageMarks: number;
  classRank: number;
  totalStudents: number;
  recentMarks: any[];
}

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [todayTimetable, setTodayTimetable] = useState<Timetable | null>(null);
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [childId, setChildId] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [stats, setStats] = useState<StudentStats>({
    attendancePercentage: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalMarks: 0,
    averageMarks: 0,
    classRank: 0,
    totalStudents: 0,
    recentMarks: []
  });

  const updateTime = () => {
    setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  };

  useEffect(() => {
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setParentName(data.user.name || "Parent");
            setChildName(data.user.studentName || "");
            setChildClass(data.user.studentClass || "");
            setChildId(data.user.studentId || "");
          }
        }
      } catch (error) {
        console.error("Error fetching parent data:", error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchAll() {
      if (!childClass || !childId) return;
      
      setLoading(true);
      
      try {
        const today = new Date().getDay();
        const dayOfWeek = today === 0 ? 1 : today;
        
        const [timetableRes, statsRes] = await Promise.all([
          fetch(`/api/timetables?className=${encodeURIComponent(childClass)}`, { credentials: "include" }),
          fetch(`/api/parent/dashboard?studentId=${encodeURIComponent(childId)}`, { credentials: "include" })
        ]);
        
        if (timetableRes.ok) {
          const timetableData = await timetableRes.json();
          if (Array.isArray(timetableData) && timetableData.length > 0) {
            const todayData = timetableData.find((t: Timetable) => t.dayOfWeek === dayOfWeek);
            setTodayTimetable(todayData || timetableData[0]);
          }
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            attendancePercentage: statsData.attendancePercentage || 0,
            totalPresent: statsData.totalPresent || 0,
            totalAbsent: statsData.totalAbsent || 0,
            totalMarks: statsData.totalMarks || 0,
            averageMarks: statsData.averageMarks || 0,
            classRank: statsData.classRank || 0,
            totalStudents: statsData.totalStudents || 0,
            recentMarks: statsData.recentMarks || []
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAll();
  }, [childClass, childId]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getCurrentDayName = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  };

  const getCurrentPeriodIndex = (periods: Period[]) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    for (let i = 0; i < periods.length; i++) {
      if (periods[i].isBreak) continue;
      
      const [startHour, startMin] = periods[i].startTime.split(":").map(Number);
      const [endHour, endMin] = periods[i].endTime.split(":").map(Number);
      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;

      if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
        return i;
      }
    }
    return -1;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  const regularPeriods = todayTimetable?.periods.filter(p => !p.isBreak) || [];
  const currentIndex = todayTimetable ? getCurrentPeriodIndex(todayTimetable.periods) : -1;

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
              <span>Parent Portal</span>
            </div>
            <h1 className={styles.title}>{getGreeting()}, {parentName || "Parent"}</h1>
            <p className={styles.subtitle}>Monitoring: {childName || "Child"} • {childClass || "Class"} • {childId || "ID"}</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.dateTimeBox}>
              <div className={styles.dateBox}>
                <FaCalendarAlt className={styles.dateIcon} />
                <span>{getCurrentDate()}</span>
              </div>
              <div className={styles.timeBox}>
                <FaClock className={styles.timeIcon} />
                <span>{currentTime}</span>
              </div>
            </div>

            <button className={styles.logoutBtn} onClick={handleLogout} disabled={loggingOut}>
              <FaSignOutAlt />
              <span>{loggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className={styles.contentGrid}>
        <motion.div 
          className={styles.sectionCard}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={`${styles.sectionIcon} ${styles.blue}`}>
                <FaCalendarAlt />
              </div>
              <div className={styles.sectionInfo}>
                <h2>{childName}&apos;s Today&apos;s Classes</h2>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                  {getCurrentDayName()} - {childClass}
                </p>
              </div>
            </div>
            <span className={styles.sectionBadge}>
              {regularPeriods.length} Classes
            </span>
            <Link href="/parent/timetable" style={{
              fontSize: "11px",
              color: "#3b82f6",
              fontWeight: 600,
              textDecoration: "none",
              marginLeft: "12px"
            }}>
              View Full →
            </Link>
          </div>

          <div className={styles.sectionContent}>
            {!todayTimetable || todayTimetable.periods.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaCalendarAlt /></div>
                <h3 className={styles.emptyTitle}>No Timetable Available</h3>
                <p className={styles.emptyText}>Timetable has not been set for this class yet.</p>
              </div>
            ) : (
              <div className={styles.classList}>
                {todayTimetable.periods.map((period, index) => {
                  if (period.isBreak) {
                    return (
                      <div
                        key={`break-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "10px",
                          margin: "6px 0",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px dashed #e2e8f0"
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                          ☕ {period.subject} ({period.startTime} - {period.endTime})
                        </span>
                      </div>
                    );
                  }
                  
                  const isCurrent = index === currentIndex;
                  return (
                    <motion.div
                      key={period._id || `period-${index}`}
                      className={`${styles.classItem} ${isCurrent ? styles.current : ""}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className={`${styles.classTime} ${isCurrent ? styles.current : ""}`}>
                        <p className={styles.periodLabel}>Period {period.periodNumber}</p>
                        <p className={styles.periodTime}>{period.startTime} - {period.endTime}</p>
                      </div>
                      
                      <div className={styles.classInfo}>
                        <h3 className={styles.subject}>{period.subject || "Not Set"}</h3>
                        <div className={styles.meta}>
                          <span><FaUser /> {period.teacherName || "TBA"}</span>
                        </div>
                      </div>
                      
                      {isCurrent ? (
                        <span className={styles.currentBadge}>Now</span>
                      ) : (
                        <div className={styles.roomBadge}>
                          <FaDoorOpen /> {period.roomNumber || "TBA"}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className={styles.sectionCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={`${styles.sectionIcon} ${styles.amber}`}>
                <FaChartLine />
              </div>
              <div className={styles.sectionInfo}>
                <h2>{childName}&apos;s Performance</h2>
              </div>
            </div>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconGreen}>
                  <FaClipboardCheck />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Attendance</p>
                  <p className={styles.statValue}>{stats.attendancePercentage}%</p>
                  <p className={styles.statMeta}>{stats.totalPresent} present • {stats.totalAbsent} absent</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBlue}>
                  <FaMedal />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Class Rank</p>
                  <p className={styles.statValue}>#{stats.classRank || "-"}</p>
                  <p className={styles.statMeta}>of {stats.totalStudents} students</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconPurple}>
                  <FaStar />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Average Marks</p>
                  <p className={styles.statValue}>{stats.averageMarks}%</p>
                  <p className={styles.statMeta}>{stats.totalMarks} exams taken</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconOrange}>
                  <FaTrophy />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Performance</p>
                  <p className={styles.statValue}>
                    {stats.averageMarks >= 90 ? "Excellent" : 
                     stats.averageMarks >= 75 ? "Good" : 
                     stats.averageMarks >= 60 ? "Average" : "Needs Work"}
                  </p>
                  <p className={styles.statMeta}>Based on marks</p>
                </div>
              </div>
            </div>

            {stats.recentMarks && stats.recentMarks.length > 0 && (
              <div className={styles.recentMarksSection}>
                <h3 className={styles.recentMarksTitle}>Recent Marks</h3>
                <div className={styles.recentMarksList}>
                  {stats.recentMarks.slice(0, 3).map((mark: any, index: number) => (
                    <div key={index} className={styles.recentMarkItem}>
                      <div className={styles.recentMarkInfo}>
                        <p className={styles.recentMarkSubject}>{mark.subject}</p>
                        <p className={styles.recentMarkMeta}>{mark.term} • {mark.examType}</p>
                      </div>
                      <div className={styles.recentMarkScore}>
                        <span className={mark.marks >= 90 ? styles.gradeA : mark.marks >= 75 ? styles.gradeB : mark.marks >= 60 ? styles.gradeC : styles.gradeD}>
                          {mark.marks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/parent/marks" className={styles.viewAllLink}>
                  View all marks →
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
