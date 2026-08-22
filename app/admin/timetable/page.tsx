"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes,
  FaDoorOpen,
  FaUser,
  FaCheck
} from "react-icons/fa";
import styles from "@/app/styles/TimetableManagement.module.css";

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

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

const DEFAULT_PERIODS = (): Period[] => [
  { periodNumber: 1, startTime: "08:00", endTime: "08:45", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 2, startTime: "08:45", endTime: "09:30", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 3, startTime: "09:30", endTime: "09:45", subject: "Break", teacherName: "", roomNumber: "", isBreak: true },
  { periodNumber: 4, startTime: "09:45", endTime: "10:30", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 5, startTime: "10:30", endTime: "11:15", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 6, startTime: "11:15", endTime: "12:00", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 7, startTime: "12:00", endTime: "12:45", subject: "", teacherName: "", roomNumber: "", isBreak: false },
  { periodNumber: 8, startTime: "12:45", endTime: "13:30", subject: "Lunch Break", teacherName: "", roomNumber: "", isBreak: true },
];

export default function TimetableManagement() {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS());
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchTimetables = useCallback(async () => {
    if (!selectedClass) {
      setTimetables([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/timetables?className=${encodeURIComponent(selectedClass)}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setTimetables(data || []);
      } else {
        console.error("Failed to fetch timetables:", res.status);
        setTimetables([]);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  const currentTimetable = timetables.find(t => t.dayOfWeek === selectedDay);

  function handleAddNew() {
    setEditingTimetable(null);
    setPeriods(DEFAULT_PERIODS());
    setShowModal(true);
  }

  function handleEdit(timetable?: Timetable) {
    if (timetable) {
      setEditingTimetable(timetable);
      setPeriods(timetable.periods);
    } else if (currentTimetable) {
      setEditingTimetable(currentTimetable);
      setPeriods(currentTimetable.periods);
    } else {
      setEditingTimetable(null);
      setPeriods(DEFAULT_PERIODS());
    }
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedClass) {
      showMessage("Please select a class first", "error");
      return;
    }

    try {
      setSaving(true);

      const timetableData = {
        className: selectedClass,
        dayOfWeek: selectedDay,
        periods: periods,
        academicYear: new Date().getFullYear().toString()
      };

      const url = editingTimetable?._id 
        ? `/api/timetables?id=${editingTimetable._id}`
        : "/api/timetables";
      
      const method = editingTimetable?._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(timetableData)
      });

      if (res.ok) {
        setShowModal(false);
        showMessage(editingTimetable ? "Timetable updated successfully!" : "Timetable created successfully!", "success");
        fetchTimetables();
      } else {
        const errorData = await res.json();
        showMessage(errorData.message || "Failed to save timetable", "error");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      showMessage("Failed to save timetable", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this timetable?")) return;

    try {
      const res = await fetch(`/api/timetables?id=${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        showMessage("Timetable deleted successfully!", "success");
        fetchTimetables();
      } else {
        showMessage("Failed to delete timetable", "error");
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      showMessage("Failed to delete timetable", "error");
    }
  }

  function updatePeriod(index: number, field: keyof Period, value: string | boolean) {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "isBreak") {
      if (value === true) {
        updated[index].subject = index === 2 ? "Break" : "Lunch Break";
        updated[index].teacherName = "";
        updated[index].roomNumber = "";
      } else {
        updated[index].subject = "";
      }
    }

    setPeriods(updated);
  }

  function addPeriod() {
    const newPeriod: Period = {
      periodNumber: periods.length + 1,
      startTime: "14:00",
      endTime: "14:45",
      subject: "",
      teacherName: "",
      roomNumber: "",
      isBreak: false
    };
    setPeriods([...periods, newPeriod]);
  }

  function removePeriod(index: number) {
    if (periods.length <= 1) return;
    const updated = periods.filter((_, i) => i !== index);
    updated.forEach((p, i) => p.periodNumber = i + 1);
    setPeriods(updated);
  }

  return (
    <div className={styles.container}>
      {message && (
        <motion.div
          className={`${styles.toast} ${styles[message.type]}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {message.type === "success" ? <FaCheck /> : <FaTimes />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><FaTimes /></button>
        </motion.div>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Timetable Management</h1>
          <p>Create and manage class schedules</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.addBtn}
            onClick={handleAddNew}
            disabled={!selectedClass}
          >
            <FaPlus /> Create Timetable
          </button>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlsLeft}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Select Class</label>
            <select
              className={styles.controlSelect}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class...</option>
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

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
      ) : !selectedClass ? (
        <div className={styles.timetableWrapper}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaCalendarAlt /></div>
            <h3 className={styles.emptyTitle}>Select a Class</h3>
            <p className={styles.emptyText}>
              Choose a class from the dropdown to view or create its timetable.
            </p>
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
              Create a new timetable for {selectedClass} on {DAYS.find(d => d.id === selectedDay)?.full}.
            </p>
            <button className={styles.addBtn} onClick={handleAddNew}>
              <FaPlus /> Create Timetable
            </button>
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
                <h2>{currentTimetable.className} - {DAYS.find(d => d.id === currentTimetable.dayOfWeek)?.full}</h2>
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

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={styles.actionBtn}
                onClick={() => handleEdit(currentTimetable)}
                title="Edit Timetable"
              >
                <FaEdit />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.delete}`}
                onClick={() => handleDelete(currentTimetable._id)}
                title="Delete Timetable"
              >
                <FaTrash />
              </button>
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>
                    {editingTimetable ? "Edit Timetable" : "Create Timetable"}
                  </h2>
                  <p className={styles.modalSubtitle}>
                    {selectedClass} | {DAYS.find(d => d.id === selectedDay)?.full}
                  </p>
                </div>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <h3 className={styles.sectionTitle}>
                  <FaCalendarAlt /> Period Schedule
                </h3>

                <div className={styles.periodsForm}>
                  {periods.map((period, index) => (
                    <div
                      key={index}
                      className={`${styles.periodFormRow} ${period.isBreak ? styles.break : ""}`}
                    >
                      <div className={styles.periodFormNum}>
                        {period.periodNumber}
                      </div>

                      <div className={styles.periodFormFields}>
                        <div className={styles.periodFormTime}>
                          <input
                            type="time"
                            className={styles.formInput}
                            value={period.startTime}
                            onChange={(e) => updatePeriod(index, "startTime", e.target.value)}
                            disabled={period.isBreak}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            className={styles.formInput}
                            value={period.endTime}
                            onChange={(e) => updatePeriod(index, "endTime", e.target.value)}
                            disabled={period.isBreak}
                          />
                        </div>

                        <input
                          type="text"
                          className={styles.formInput}
                          value={period.subject}
                          onChange={(e) => updatePeriod(index, "subject", e.target.value)}
                          placeholder={period.isBreak ? "Break Name" : "Subject"}
                          disabled={period.isBreak}
                        />

                        {!period.isBreak && (
                          <>
                            <input
                              type="text"
                              className={styles.formInput}
                              value={period.teacherName}
                              onChange={(e) => updatePeriod(index, "teacherName", e.target.value)}
                              placeholder="Teacher Name"
                            />
                            <input
                              type="text"
                              className={styles.formInput}
                              value={period.roomNumber}
                              onChange={(e) => updatePeriod(index, "roomNumber", e.target.value)}
                              placeholder="Room No."
                            />
                          </>
                        )}

                        <label className={styles.breakCheckbox}>
                          <input
                            type="checkbox"
                            checked={period.isBreak}
                            onChange={(e) => updatePeriod(index, "isBreak", e.target.checked)}
                          />
                          <span>Mark as Break</span>
                        </label>
                      </div>

                      <button
                        className={styles.periodDeleteBtn}
                        onClick={() => removePeriod(index)}
                        disabled={periods.length <= 1}
                        type="button"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className={styles.addPeriodBtn}
                  onClick={addPeriod}
                  type="button"
                >
                  <FaPlus /> Add Period
                </button>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving || !selectedClass}
                >
                  {saving ? "Saving..." : "Save Timetable"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
