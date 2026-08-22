"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/styles/TeacherDashboard.module.css";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/app/components/admin/NotificationBell";
import { 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaClock,
  FaBell,
  FaSignOutAlt,
  FaBook,
  FaClipboardList,
  FaExclamationCircle,
  FaCheckCircle,
  FaGraduationCap,
  FaDoorOpen,
  FaCoffee,
  FaInfoCircle,
  FaExclamationTriangle
} from "react-icons/fa";

interface TodaySchedule {
  _id: string;
  time: string;
  subject: string;
  className: string;
  periodType: string;
  room: string;
  periodNumber: number;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  time: string;
  category: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "important";
  priority: "normal" | "high" | "urgent";
  createdAt: string;
  expiresAt: string;
}

interface DashboardData {
  teacher: {
    name: string;
    email: string;
    photo?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    department?: string;
    designation?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
    assignedClassSubjects?: Record<string, string[]>;
  };
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalSubjects: number;
    todayClasses: number;
    todayPeriods: number;
    subjects: string[];
    classSubjects?: Record<string, string[]>;
  };
  todaySchedule: TodaySchedule[];
  alerts: Alert[];
  announcements: Announcement[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      "Mathematics": "#3b82f6",
      "Science": "#10b981",
      "English": "#8b5cf6",
      "Hindi": "#f59e0b",
      "Social Science": "#06b6d4",
      "Computer": "#6366f1",
      "Sanskrit": "#ec4899"
    }
    return colors[subject] || "#64748b"
  }

  useEffect(() => {
    fetchDashboardData();
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isWeekend = currentTime && (currentTime.getDay() === 0);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/teachers/dashboard-stats", {
        credentials: "include"
      });

      if (res.status === 401) {
        router.push("/login/teacher");
        return;
      }

      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      router.push("/login/teacher");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  const formattedDate = currentTime ? currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";

  const formattedTime = currentTime ? currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

  const getDayGreeting = () => {
    const hour = currentTime?.getHours() || 0;
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getCurrentPeriodIndex = (schedule: TodaySchedule[]) => {
    if (!currentTime) return -1;
    for (let i = 0; i < schedule.length; i++) {
      const [start] = schedule[i].time.split(" - ");
      const [hours, minutes] = start.split(":").map(Number);
      const now = currentTime;
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour < hours) return i - 1;
      if (currentHour > hours) continue;
      if (currentMinute >= minutes) return i;
    }
    return schedule.length - 1;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning": return <FaExclamationTriangle />;
      case "success": return <FaCheckCircle />;
      case "error": return <FaExclamationCircle />;
      case "info": return <FaInfoCircle />;
      default: return <FaBell />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning": return { bg: "#fef3c7", border: "#f59e0b", icon: "#f59e0b", text: "#92400e" };
      case "success": return { bg: "#dcfce7", border: "#22c55e", icon: "#22c55e", text: "#166534" };
      case "error": return { bg: "#fee2e2", border: "#ef4444", icon: "#ef4444", text: "#991b1b" };
      default: return { bg: "#dbeafe", border: "#3b82f6", icon: "#3b82f6", text: "#1e40af" };
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "warning": return <FaExclamationTriangle />;
      case "success": return <FaCheckCircle />;
      case "important": return <FaExclamationCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "warning": return { bg: "#fffbeb", border: "#f59e0b", icon: "#f59e0b", text: "#92400e", title: "#78350f" };
      case "success": return { bg: "#ecfdf5", border: "#10b981", icon: "#10b981", text: "#166534", title: "#14532d" };
      case "important": return { bg: "#fef2f2", border: "#ef4444", icon: "#ef4444", text: "#991b1b", title: "#7f1d1d" };
      default: return { bg: "#eff6ff", border: "#3b82f6", icon: "#3b82f6", text: "#1e40af", title: "#1e3a8a" };
    }
  };

  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const currentPeriodIdx = data?.todaySchedule ? getCurrentPeriodIndex(data.todaySchedule) : -1;

  return (
    <div className={styles.container}>
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <FaChalkboardTeacher className={styles.breadcrumbIcon} />
            <span>Teacher Dashboard</span>
          </div>
          <h1 className={styles.title}>
            {getDayGreeting()}, {data?.teacher?.name?.split(" ")[0] || "Teacher"}!
          </h1>
          <p className={styles.subtitle}>
            Here&apos;s your teaching overview for today, {formattedDate}
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateTimeBox}>
            <div className={styles.dateBox}>
              <FaCalendarAlt className={styles.dateIcon} />
              <span>{formattedDate}</span>
            </div>
            <div className={styles.timeBox}>
              <FaClock className={styles.timeIcon} />
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className={styles.notificationWrapper}>
            <NotificationBell />
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout} disabled={loggingOut}>
            <FaSignOutAlt />
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </motion.header>

      <div className={styles.statsRow}>
        <motion.div 
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))", color: "#3b82f6" }}>
            <FaChalkboardTeacher />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Assigned Classes</p>
            <p className={styles.statValue}>{data?.stats?.totalClasses || 0}</p>
          </div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))", color: "#8b5cf6" }}>
            <FaUserGraduate />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{data?.stats?.totalStudents || 0}</p>
          </div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1))", color: "#f59e0b" }}>
            <FaBook />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Subjects</p>
            <p className={styles.statValue}>{data?.stats?.totalSubjects || 0}</p>
          </div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e" }}>
            <FaClipboardList />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Today&apos;s Classes</p>
            <p className={styles.statValue}>{data?.stats?.todayClasses || 0}</p>
          </div>
        </motion.div>
      </div>

      {data?.teacher?.assignedClasses && data.teacher.assignedClasses.length > 0 && (
        <motion.div 
          className={styles.subjectsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className={styles.subjectsHeader}>
            <FaBook className={styles.subjectsIcon} />
            <h3>My Classes & Subjects</h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
            {data.teacher.assignedClasses.map((cls, index) => (
              <div 
                key={index}
                style={{
                  background: "white",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  minWidth: "180px"
                }}
              >
                <div style={{ fontWeight: 700, color: "#1e3a5f", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaGraduationCap />
                  {cls}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {data.teacher.assignedClassSubjects?.[cls]?.map((subject, subjIndex) => (
                    <span 
                      key={subjIndex}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: `${getSubjectColor(subject)}20`,
                        color: getSubjectColor(subject)
                      }}
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(!data?.teacher?.assignedClasses || data.teacher.assignedClasses.length === 0) && data?.stats?.subjects && data.stats.subjects.length > 0 && (
        <motion.div 
          className={styles.subjectsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className={styles.subjectsHeader}>
            <FaBook className={styles.subjectsIcon} />
            <h3>Assigned Subjects</h3>
          </div>
          <div className={styles.subjectsList}>
            {data.stats.subjects.map((subject, index) => (
              <span key={index} className={styles.subjectBadge}>{subject}</span>
            ))}
          </div>
        </motion.div>
      )}

      <div className={styles.dashboardGrid}>
        <motion.div 
          className={styles.scheduleSection}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className={styles.scheduleHeader}>
            <div className={styles.scheduleTitleRow}>
              <div className={styles.scheduleTitleIcon}>
                <FaCalendarAlt />
              </div>
              <div>
                <h2 className={styles.scheduleTitle}>Today&apos;s Schedule</h2>
                <p className={styles.scheduleSubtitle}>
                  {currentTime ? currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : ""}
                </p>
              </div>
            </div>
            <div className={styles.scheduleBadge}>
              {isWeekend ? "Weekend" : `${data?.stats?.todayPeriods || 0} Periods | ${data?.stats?.todayClasses || 0} Classes`}
            </div>
          </div>
          
          <div className={styles.scheduleContent}>
            {data?.todaySchedule && data.todaySchedule.length > 0 ? (
              <div className={styles.timelineWrapper}>
                <div className={styles.timelineLine}></div>
                <AnimatePresence mode="popLayout">
                  {data.todaySchedule.map((schedule, index) => {
                    const isBreak = schedule.periodType === "Break" || schedule.periodType === "break";
                    const isFree = schedule.periodType === "Free" || schedule.subject === "No Classes Scheduled";
                    const isCurrent = index === currentPeriodIdx;
                    const isPast = index < currentPeriodIdx;
                    
                    return (
                      <motion.div
                        key={schedule._id}
                        className={`${styles.scheduleItem} ${isBreak ? styles.breakItem : ""} ${isCurrent ? styles.currentItem : ""} ${isPast ? styles.pastItem : ""}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        layout
                      >
                        <div className={styles.timelineDot}>
                          {isBreak ? (
                            <FaCoffee />
                          ) : isCurrent ? (
                            <div className={styles.currentDot}></div>
                          ) : (
                            <div className={styles.periodDot}></div>
                          )}
                        </div>
                        
                        <div className={styles.scheduleCard}>
                          <div className={styles.scheduleTime}>
                            <span className={styles.periodNumber}>P{schedule.periodNumber}</span>
                            <span className={styles.timeRange}>{schedule.time}</span>
                          </div>
                          
                          <div className={styles.scheduleDetails}>
                            <div className={styles.subjectRow}>
                              {isBreak ? (
                                <FaCoffee className={styles.breakIcon} />
                              ) : (
                                <FaBook className={styles.subjectIcon} />
                              )}
                              <span className={styles.subjectName}>{schedule.subject}</span>
                            </div>
                            
                            {!isBreak && !isFree && (
                              <div className={styles.metaRow}>
                                <span className={styles.metaItem}>
                                  <FaGraduationCap /> {schedule.className}
                                </span>
                                {schedule.room && (
                                  <span className={styles.metaItem}>
                                    <FaDoorOpen /> {schedule.room}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className={styles.scheduleStatus}>
                            {isBreak && (
                              <span className={styles.breakBadge}>Break</span>
                            )}
                            {isFree && !isCurrent && (
                              <span className={styles.freeBadge}>Free</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                className={styles.emptySchedule}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.emptyIcon}>
                  <FaCalendarAlt />
                </div>
                <h3>{isWeekend ? "No Classes Today (Sunday)" : "No Classes Scheduled Today"}</h3>
                <p>{isWeekend ? "Enjoy your weekend! School resumes on Monday." : "Enjoy your free day! Check back tomorrow for your schedule."}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className={styles.alertsSection}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className={styles.alertsHeader}>
            <div className={styles.alertsTitleRow}>
              <div className={styles.alertsTitleIcon}>
                <FaBell />
              </div>
              <div>
                <h2 className={styles.alertsTitle}>School Announcements</h2>
                <p className={styles.alertsSubtitle}>Official notices from the administration</p>
              </div>
            </div>
            {data?.announcements && data.announcements.length > 0 && (
              <div className={styles.alertsBadge}>
                {data.announcements.length} Active
              </div>
            )}
          </div>
          
          <div className={styles.alertsContent}>
            {data?.announcements && data.announcements.length > 0 ? (
              <div className={styles.announcementsList}>
                <AnimatePresence mode="popLayout">
                  {data.announcements.map((announcement, index) => {
                    const colors = getAnnouncementColor(announcement.type);
                    return (
                      <motion.div
                        key={announcement.id}
                        className={styles.announcementCard}
                        style={{ 
                          backgroundColor: colors.bg,
                          borderLeftColor: colors.border
                        }}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        layout
                        whileHover={{ scale: 1.01, x: 4 }}
                      >
                        <div className={styles.announcementHeader}>
                          <div className={styles.announcementIconWrapper} style={{ color: colors.icon }}>
                            {getAnnouncementIcon(announcement.type)}
                          </div>
                          <div className={styles.announcementMeta}>
                            {announcement.priority === "urgent" && (
                              <span className={styles.urgentBadge}>Urgent</span>
                            )}
                            {announcement.priority === "high" && (
                              <span className={styles.highBadge}>Important</span>
                            )}
                          </div>
                        </div>
                        <h4 className={styles.announcementTitle} style={{ color: colors.title }}>
                          {announcement.title}
                        </h4>
                        <p className={styles.announcementMessage} style={{ color: colors.text }}>
                          {announcement.message}
                        </p>
                        <div className={styles.announcementFooter}>
                          <span className={styles.announcementDate}>
                            <FaCalendarAlt />
                            Valid until {new Date(announcement.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                className={styles.emptyAlerts}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.emptyIcon}>
                  <FaCheckCircle />
                </div>
                <h3>All Caught Up!</h3>
                <p>No new announcements at the moment.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
