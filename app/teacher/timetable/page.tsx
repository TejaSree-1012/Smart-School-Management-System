"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaDoorOpen, FaUser, FaGraduationCap, FaBook } from "react-icons/fa";
import styles from "@/app/styles/TeacherTimetable.module.css";

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

export default function TeacherTimetable() {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [teacherName, setTeacherName] = useState("");
  
  const today = new Date().getDay();
  const todayDay = today === 0 ? 1 : today === 6 ? 6 : today;
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  async function fetchTeacherData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.name) {
          setTeacherName(data.user.name);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    }
  }

  useEffect(() => {
    if (teacherName) {
      fetchTeacherTimetables();
    }
  }, [teacherName]);

  async function fetchTeacherTimetables() {
    try {
      setLoading(true);
      const res = await fetch(`/api/timetables?teacherName=${encodeURIComponent(teacherName)}`, {
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

  const selectedDayTimetables = timetables.filter(t => t.dayOfWeek === selectedDay);

  const getTotalClasses = () => {
    return selectedDayTimetables.reduce((count, tt) => {
      return count + tt.periods.filter(p => !p.isBreak && p.teacherName === teacherName).length;
    }, 0);
  };

  const getTotalBreaks = () => {
    return selectedDayTimetables.reduce((count, tt) => {
      return count + tt.periods.filter(p => p.isBreak).length;
    }, 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>My Timetable</h1>
          <p>View your weekly teaching schedule</p>
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.infoItem}>
            <FaUser />
            <span>{teacherName || "Teacher"}</span>
          </div>
        </div>
      </div>

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
      ) : selectedDayTimetables.length === 0 ? (
        <div className={styles.timetableWrapper}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaCalendarAlt /></div>
            <h3 className={styles.emptyTitle}>
              No Classes on {DAYS.find(d => d.id === selectedDay)?.full}
            </h3>
            <p className={styles.emptyText}>
              You have no scheduled classes on {DAYS.find(d => d.id === selectedDay)?.full}.
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
                <h2>{DAYS.find(d => d.id === selectedDay)?.full}</h2>
                <p>Academic Year {selectedDayTimetables[0]?.academicYear || "2025-2026"} | {selectedDayTimetables.length} Classes</p>
              </div>
            </div>

            <div className={styles.timetableStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{getTotalClasses()}</div>
                <div className={styles.statLabel}>Your Classes</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{getTotalBreaks()}</div>
                <div className={styles.statLabel}>Breaks</div>
              </div>
            </div>
          </div>

          <div className={styles.periodsContainer}>
            {selectedDayTimetables.map((timetable, ttIndex) => {
              const filteredPeriods = timetable.periods.filter(p => p.teacherName === teacherName || p.isBreak);
              
              if (filteredPeriods.length === 0) return null;
              
              return (
                <div key={timetable._id} className={styles.classSection}>
                  <div className={styles.classSectionHeader}>
                    <FaGraduationCap />
                    <span>{timetable.className}</span>
                  </div>
                  <div className={styles.periodsGrid}>
                    {filteredPeriods.map((period, index) => (
                      <motion.div
                        key={period._id || `${timetable._id}-${index}`}
                        className={`${styles.periodCard} ${period.isBreak ? styles.break : ""}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: (ttIndex * filteredPeriods.length + index) * 0.03 }}
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
                                <FaDoorOpen /> {period.roomNumber || "TBA"}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
