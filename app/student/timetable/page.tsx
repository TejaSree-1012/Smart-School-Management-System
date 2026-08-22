"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaDoorOpen, FaUser, FaBook, FaHome } from "react-icons/fa";
import styles from "@/app/styles/StudentTimetable.module.css";

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

const DAYS = [
  { id: 1, short: "Mon", full: "Monday" },
  { id: 2, short: "Tue", full: "Tuesday" },
  { id: 3, short: "Wed", full: "Wednesday" },
  { id: 4, short: "Thu", full: "Thursday" },
  { id: 5, short: "Fri", full: "Friday" },
  { id: 6, short: "Sat", full: "Saturday" }
];

export default function StudentTimetable() {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (studentClass) {
      fetchTimetables();
    }
  }, [studentClass]);

  async function fetchStudentData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setStudentName(data.user.name || "Student");
          setStudentClass(data.user.class || "");
          const today = new Date().getDay();
          setSelectedDay(today === 0 ? 1 : today);
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  }

  async function fetchTimetables() {
    try {
      setLoading(true);
      const res = await fetch(`/api/timetables?className=${encodeURIComponent(studentClass)}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setTimetables(data || []);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  }

  const currentTimetable = timetables.find(t => t.dayOfWeek === selectedDay);

  const renderHeader = () => (
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
          <h1 className={styles.title}>My Timetable</h1>
          <p className={styles.subtitle}>View your weekly class schedule</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateTimeBox}>
            <div className={styles.dateBox}>
              <FaBook />
              <span>{studentClass}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={styles.container}>
      {renderHeader()}

      <div className={styles.controlsSection}>
        <div className={styles.weekDays}>
          {DAYS.map(day => (
            <button
              key={day.id}
              className={`${styles.dayBtn} ${selectedDay === day.id ? styles.active : ""}`}
              onClick={() => setSelectedDay(day.id)}
            >
              {day.short}
              <span>{day.full}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.timetableWrapper}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading timetables...</p>
          </div>
        </div>
      ) : !currentTimetable ? (
        <div className={styles.timetableWrapper}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaCalendarAlt /></div>
            <h3 className={styles.emptyTitle}>
              No Timetable for {DAYS.find(d => d.id === selectedDay)?.full}
            </h3>
            <p className={styles.emptyText}>
              Timetable for {studentClass} on {DAYS.find(d => d.id === selectedDay)?.full} has not been set yet.
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          className={styles.timetableWrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.timetableHeader}>
            <div className={styles.timetableInfo}>
              <div className={styles.timetableIcon}>
                <FaCalendarAlt />
              </div>
              <div className={styles.timetableMeta}>
                <h2>{studentClass} - {DAYS.find(d => d.id === currentTimetable.dayOfWeek)?.full}</h2>
                <p>Academic Year {currentTimetable.academicYear} | {currentTimetable.periods.length} periods</p>
              </div>
            </div>

            <div className={styles.timetableStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {currentTimetable.periods.filter(p => !p.isBreak).length}
                </div>
                <div className={styles.statLabel}>Classes</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {currentTimetable.periods.filter(p => p.isBreak).length}
                </div>
                <div className={styles.statLabel}>Breaks</div>
              </div>
            </div>
          </div>

          <div className={styles.periodsContainer}>
            <div className={styles.periodsGrid}>
              {currentTimetable.periods.map((period, index) => (
                <motion.div
                  key={period._id || index}
                  className={`${styles.periodCard} ${period.isBreak ? styles.break : ""}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className={styles.periodTime}>
                    <span className={styles.periodNumber}>Period {period.periodNumber}</span>
                    <span className={styles.periodTimeValue}>
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>

                  <div className={styles.periodContent}>
                    <h4 className={styles.subjectName}>
                      {period.isBreak ? period.subject : (period.subject || "Not Set")}
                    </h4>
                    {!period.isBreak && (
                      <div className={styles.periodDetails}>
                        <span className={styles.detailItem}>
                          <FaUser /> {period.teacherName || "TBA"}
                        </span>
                        <span className={styles.detailItem}>
                          <FaDoorOpen /> {period.roomNumber || "TBA"}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
