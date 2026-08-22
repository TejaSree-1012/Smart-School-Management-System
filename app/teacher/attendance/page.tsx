"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/students.module.css";
import { 
  FaClipboardCheck, 
  FaUsers, 
  FaBook, 
  FaUserCircle,
  FaCheck,
  FaTimes,
  FaCalendar,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPrint,
  FaDownload,
  FaClock,
  FaGraduationCap
} from "react-icons/fa";

type AttendanceRecord = {
  _id?: string;
  studentId: string;
  studentName: string;
  email?: string;
  fatherName?: string;
  phone?: string;
  gender?: string;
  classApplying?: string;
  attendanceStatus?: string;
  attendanceId?: string;
  status?: string;
};

type Message = {
  show: boolean;
  text: string;
  type: "success" | "error" | "warning";
};

export default function TeacherAttendance() {
  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [classStats, setClassStats] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeClass, setActiveClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [message, setMessage] = useState<Message>({ show: false, text: "", type: "success" });
  const [teacherName, setTeacherName] = useState("Teacher");
  const [viewMode, setViewMode] = useState<"mark" | "history">("mark");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});
  const [assignedClassesInfo, setAssignedClassesInfo] = useState<{className: string, subjects: string[]}[]>([]);

  useEffect(() => {
    fetchTeacherData();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeClass) {
      if (viewMode === "mark") {
        fetchStudentsForAttendance();
      } else {
        fetchAttendanceHistory();
      }
    }
  }, [activeClass, selectedDate, viewMode]);

  function showMessage(text: string, type: "success" | "error" | "warning" = "success") {
    setMessage({ show: true, text, type });
    setTimeout(() => {
      setMessage({ show: false, text: "", type: "success" });
    }, 5000);
  }

  async function fetchTeacherData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setTeacherName(data.user.name || "Teacher");
        }
      }
      
      const statsRes = await fetch("/api/teachers/dashboard-stats", { credentials: "include" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.teacher?.assignedClasses) {
          const classesInfo: {className: string, subjects: string[]}[] = [];
          Object.entries(statsData.teacher.assignedClassSubjects || {}).forEach(([cls, subjects]) => {
            classesInfo.push({ className: cls, subjects: subjects as string[] });
          });
          setAssignedClassesInfo(classesInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/teachers/attendance?mode=stats");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setClassStats(data.classStats || {});
        if (data.classes?.length > 0 && !activeClass) {
          setActiveClass(data.classes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsForAttendance() {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers/attendance?class=${encodeURIComponent(activeClass)}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      
      setStudents(data.students || []);
      setAlreadyMarked(data.alreadyMarked || false);
      
      const map: Record<string, boolean> = {};
      data.students.forEach((s: AttendanceRecord) => {
        map[s.studentId] = s.attendanceStatus === "present" || !s.attendanceStatus;
      });
      setAttendanceMap(map);
    } catch (error) {
      console.error("Fetch students error:", error);
      showMessage("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendanceHistory() {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers/attendance?mode=history&class=${encodeURIComponent(activeClass)}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistoryData(data.attendance || []);
    } catch (error) {
      console.error("Fetch history error:", error);
      showMessage("Failed to load attendance history", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleMarkAll = (present: boolean) => {
    const map: Record<string, boolean> = {};
    students.forEach(s => {
      map[s.studentId] = present;
    });
    setAttendanceMap(map);
  };

  const handleSubmitAttendance = async () => {
    const absentees = students.filter(s => !attendanceMap[s.studentId]);
    
    if (absentees.length === 0 && !confirm("All students marked as present. Submit attendance?")) {
      return;
    }

    setSubmitting(true);
    try {
      const attendanceRecords = students.map(s => ({
        studentId: s.studentId,
        studentName: s.studentName,
        status: attendanceMap[s.studentId] ? "present" : "absent"
      }));

      const res = await fetch("/api/teachers/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceRecords,
          date: selectedDate,
          className: activeClass
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit attendance");
      }

      setAlreadyMarked(true);
      showMessage(data.message, "success");
      
      if (data.absenteesCount > 0) {
        setTimeout(() => {
          showMessage(`${data.absenteesCount} student(s) marked as absent`, "warning");
        }, 100);
      }
      
      fetchStats();
    } catch (error: any) {
      console.error("Submit attendance error:", error);
      showMessage(error.message || "Failed to submit attendance", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      (s.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.fatherName || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const presentCount = students.filter(s => attendanceMap[s.studentId]).length;
  const absentCount = students.length - presentCount;

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Attendance Sheet - ${activeClass} - ${selectedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e3a5f; text-align: center; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #1e3a5f; color: white; }
            .present { color: green; }
            .absent { color: red; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature div { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Smart School Attendance Sheet</h1>
            <p><strong>Class:</strong> ${activeClass} | <strong>Date:</strong> ${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Teacher:</strong> ${teacherName}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Father Name</th>
                <th>Status</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.studentId || "N/A"}</td>
                  <td>${s.studentName || "N/A"}</td>
                  <td>${s.fatherName || "N/A"}</td>
                  <td class="${attendanceMap[s.studentId] ? 'present' : 'absent'}">${attendanceMap[s.studentId] ? 'Present ✓' : 'Absent ✗'}</td>
                  <td></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="info">
            <p><strong>Total Students:</strong> ${students.length}</p>
            <p><strong>Present:</strong> ${presentCount}</p>
            <p><strong>Absent:</strong> ${absentCount}</p>
          </div>
          <div class="signature">
            <div><p>Teacher Signature</p><br/><br/></div>
            <div><p>Principal Signature</p><br/><br/></div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Official School Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "200px",
          height: "200px",
          background: "rgba(245, 158, 11, 0.08)",
          borderRadius: "50%"
        }}/>
        <div style={{
          position: "absolute",
          bottom: "-50px",
          left: "30%",
          width: "150px",
          height: "150px",
          background: "rgba(59, 130, 246, 0.06)",
          borderRadius: "50%"
        }}/>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: "rgba(245, 158, 11, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FaClipboardCheck style={{ color: "#fbbf24", fontSize: "28px" }}/>
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" }}>
                Smart School Management System
              </p>
              <h1 style={{ color: "#ffffff", fontSize: "24px", fontWeight: 700, margin: 0 }}>
                Student Attendance Management
              </h1>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0 }}>
            Mark and track daily student attendance for your assigned classes
          </p>
        </div>
      </div>
      
      {/* Teacher Info Banner */}
      <div style={{
        background: "linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)",
        borderRadius: "12px",
        padding: "16px 24px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fbbf24",
            fontWeight: 700,
            fontSize: "16px"
          }}>
            {getInitials(teacherName)}
          </div>
          <div>
            <p style={{ color: "#94a3b8", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", margin: "0 0 2px 0" }}>
              Conducted By
            </p>
            <p style={{ color: "#1e3a5f", fontWeight: 600, fontSize: "14px", margin: 0 }}>{teacherName}</p>
          </div>
        </div>
        {assignedClassesInfo.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {assignedClassesInfo.slice(0, 3).map((info, i) => (
              <span key={i} style={{
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600
              }}>
                {info.className}
              </span>
            ))}
            {assignedClassesInfo.length > 3 && (
              <span style={{
                background: "#f1f5f9",
                color: "#64748b",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600
              }}>
                +{assignedClassesInfo.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message Toast */}
      {message.show && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === "success" ? <FaCheck /> : message.type === "warning" ? <FaExclamationTriangle /> : <FaTimes />}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage({ show: false, text: "", type: "success" })}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaUsers /></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{students.length}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e" }}>
            <FaCheckCircle />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Present</p>
            <p className={styles.statValue}>{presentCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))", color: "#ef4444" }}>
            <FaTimesCircle />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Absent</p>
            <p className={styles.statValue}>{absentCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))", color: "#8b5cf6" }}>
            <FaClock />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Date</p>
            <p className={styles.statValue} style={{ fontSize: "14px" }}>{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
      </div>

      {/* Class Filter & Mode Toggle */}
      <div className={styles.classFilterSection}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
            <button
              onClick={() => setViewMode("mark")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "mark" ? "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)" : "transparent",
                color: viewMode === "mark" ? "#fff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              <FaClipboardCheck style={{ marginRight: "6px" }} /> Mark Attendance
            </button>
            <button
              onClick={() => setViewMode("history")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "history" ? "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)" : "transparent",
                color: viewMode === "history" ? "#fff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              <FaClock style={{ marginRight: "6px" }} /> View History
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer"
            }}
          />
        </div>

        <label className={styles.filterLabel} style={{ marginTop: "16px" }}>Select Class</label>
        <div className={styles.classFilters}>
          {classes.map((cls) => (
            <button
              key={cls}
              className={`${styles.classFilterBtn} ${activeClass === cls ? styles.active : ""}`}
              onClick={() => setActiveClass(cls)}
            >
              {cls}
              {classStats[cls] && (
                <span className={styles.classCount}>
                  {classStats[cls].total > 0 ? `${classStats[cls].present}/${classStats[cls].total}` : classStats[cls].total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchFilterRow}>
        <input
          type="text"
          placeholder="Search by name, ID or parent name..."
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.resultCount}>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      ) : viewMode === "mark" ? (
        <>
          {alreadyMarked && (
            <div style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.05))",
              border: "1px solid #f59e0b",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <FaExclamationTriangle style={{ color: "#f59e0b", fontSize: "18px" }} />
              <span style={{ color: "#92400e", fontSize: "13px", fontWeight: 600 }}>
                Attendance has already been marked for this class on {new Date(selectedDate).toLocaleDateString()}. 
                Submitting again will update the existing records.
              </span>
            </div>
          )}

          {absentCount > 0 && (
            <div style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <FaTimesCircle style={{ color: "#ef4444", fontSize: "18px" }} />
              <span style={{ color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>
                {absentCount} student(s) marked as absent
              </span>
            </div>
          )}

          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>
                <FaUsers /> Attendance - {activeClass}
              </span>
              <div className={styles.tableActions}>
                <button 
                  className={styles.tableActionBtn} 
                  onClick={() => handleMarkAll(true)}
                  style={{ color: "#22c55e" }}
                >
                  <FaCheckCircle /> Mark All Present
                </button>
                <button 
                  className={styles.tableActionBtn} 
                  onClick={() => handleMarkAll(false)}
                  style={{ color: "#ef4444" }}
                >
                  <FaTimesCircle /> Mark All Absent
                </button>
                <button className={styles.tableActionBtn} onClick={handlePrint}>
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>S.No</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Class</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Present</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Absent</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s, index) => (
                  <tr key={s._id || s.studentId}>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.studentPhotoPlaceholder}>
                          {getInitials(s.studentName)}
                        </div>
                        <div>
                          <div className={styles.studentName}>{s.studentName}</div>
                          <div className={styles.studentEmail}>{s.fatherName || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.studentId}>{s.studentId || "N/A"}</span>
                    </td>
                    <td>
                      <span className={styles.classBadge}>
                        <FaBook /> {s.classApplying || activeClass}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setAttendanceMap(prev => ({ ...prev, [s.studentId]: true }))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          border: `2px solid ${attendanceMap[s.studentId] ? "#22c55e" : "#e2e8f0"}`,
                          background: attendanceMap[s.studentId] ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "#fff",
                          color: attendanceMap[s.studentId] ? "#fff" : "#e2e8f0",
                          fontSize: "16px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <FaCheck />
                      </button>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setAttendanceMap(prev => ({ ...prev, [s.studentId]: false }))}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          border: `2px solid ${!attendanceMap[s.studentId] ? "#ef4444" : "#e2e8f0"}`,
                          background: !attendanceMap[s.studentId] ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "#fff",
                          color: !attendanceMap[s.studentId] ? "#fff" : "#e2e8f0",
                          fontSize: "16px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div style={{
            marginTop: "24px",
            padding: "20px 24px",
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                <strong>{students.length}</strong> students in this class
              </p>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                {presentCount} present, {absentCount} absent
              </p>
            </div>
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || students.length === 0}
              style={{
                padding: "14px 32px",
                background: submitting ? "#94a3b8" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: submitting ? "none" : "0 4px 15px rgba(34, 197, 94, 0.3)",
                transition: "all 0.3s ease"
              }}
            >
              <FaCheck /> {submitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </>
      ) : (
        /* History View */
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              <FaClock /> Attendance History - {activeClass} ({new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
            </span>
            <div className={styles.tableActions}>
              <button className={styles.tableActionBtn} onClick={handlePrint}>
                <FaPrint /> Print
              </button>
            </div>
          </div>

          {historyData.length === 0 ? (
            <div className={styles.emptyState}>
              <FaClipboardCheck />
              <h3>No Attendance Records</h3>
              <p>Attendance has not been marked for this class on the selected date.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Status</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((record: any, index: number) => (
                  <tr key={record._id}>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.studentPhotoPlaceholder}>
                          {getInitials(record.studentName)}
                        </div>
                        <div>
                          <div className={styles.studentName}>{record.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.studentId}>{record.studentId}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${record.status === "present" || record.status === "late" ? styles.active : styles.inactive}`}>
                        {record.status === "present" ? "Present" : record.status === "late" ? "Late" : "Absent"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "12px" }}>{record.teacherName || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
