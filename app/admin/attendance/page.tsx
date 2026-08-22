"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/AdminAttendance.module.css";
import { 
  FaCalendarCheck,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaBook,
  FaCalendarAlt,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPrint,
  FaHome,
  FaExclamationTriangle,
  FaCheck,
  FaTimes
} from "react-icons/fa";

type AttendanceRecord = {
  _id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: string;
  teacherName?: string;
};

type ClassStats = {
  totalStudents: number;
  present: number;
  absent: number;
  notMarked: number;
  marked: boolean;
  percentage: number;
};

type Summary = {
  totalClasses: number;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  markedClasses: number;
  attendancePercentage: number;
};

type OverviewData = {
  date: string;
  classes: string[];
  classWiseStats: Record<string, ClassStats>;
  summary: Summary;
};

export default function AdminAttendance() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassAttendance();
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedClass, selectedDate]);

  async function fetchOverview() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/attendance?mode=overview&date=${selectedDate}`, {
        credentials: "include"
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in as admin");
        } else {
          setError("Failed to load attendance data");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error("Error fetching overview:", error);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function fetchClassAttendance() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}&class=${encodeURIComponent(selectedClass!)}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.attendance || []);
      }
    } catch (error) {
      console.error("Error fetching class attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  const changeDate = (delta: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedClass(null);
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      record.studentName.toLowerCase().includes(searchLower) ||
      record.studentId.toLowerCase().includes(searchLower)
    );
  });

  const presentCount = filteredRecords.filter(r => r.status === "present" || r.status === "late").length;
  const absentCount = filteredRecords.filter(r => r.status === "absent").length;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Attendance Report - ${selectedClass} - ${selectedDate}</title>
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Smart School - Attendance Report</h1>
            <p><strong>Class:</strong> ${selectedClass} | <strong>Date:</strong> ${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.studentId}</td>
                  <td>${r.studentName}</td>
                  <td class="${r.status === 'present' ? 'present' : 'absent'}">${r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : 'Absent'}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="info">
            <p><strong>Total:</strong> ${filteredRecords.length}</p>
            <p><strong>Present:</strong> ${presentCount}</p>
            <p><strong>Absent:</strong> ${absentCount}</p>
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

  if (loading && !overview) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <FaExclamationTriangle />
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <FaHome className={styles.breadcrumbIcon} />
            <span>Admin Portal</span>
          </div>
          <h1 className={styles.title}>Attendance Management</h1>
          <p className={styles.subtitle}>Monitor and manage student attendance across all classes</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateNavigator}>
            <button onClick={() => changeDate(-1)} className={styles.navBtn}>
              <FaChevronLeft />
            </button>
            <div className={styles.dateDisplay}>
              <FaCalendarAlt />
              <span>{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <button onClick={() => changeDate(1)} className={styles.navBtn}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {overview && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))", color: "#3b82f6" }}>
              <FaBook />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Classes</p>
              <p className={styles.statValue}>{overview.summary.totalClasses}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e" }}>
              <FaUsers />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Students</p>
              <p className={styles.statValue}>{overview.summary.totalStudents}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e" }}>
              <FaUserCheck />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Present</p>
              <p className={styles.statValue}>{overview.summary.totalPresent}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))", color: "#ef4444" }}>
              <FaUserTimes />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Absent</p>
              <p className={styles.statValue}>{overview.summary.totalAbsent}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.1))", color: "#8b5cf6" }}>
              <FaCalendarCheck />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Classes Marked</p>
              <p className={styles.statValue}>{overview.summary.markedClasses}/{overview.summary.totalClasses}</p>
            </div>
          </div>
        </div>
      )}

      {/* Class List */}
      {!selectedClass && overview && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={styles.sectionIcon}>
                <FaUsers />
              </div>
              <div className={styles.sectionInfo}>
                <h2>Class-wise Attendance</h2>
                <p>Click on a class to view student attendance</p>
              </div>
            </div>
          </div>

          <div className={styles.classGrid}>
            {overview.classes.map((cls) => {
              const stats = overview.classWiseStats[cls];
              return (
                <div
                  key={cls}
                  className={`${styles.classCard} ${stats?.marked ? styles.marked : styles.notMarked}`}
                  onClick={() => setSelectedClass(cls)}
                >
                  <div className={styles.classHeader}>
                    <h3>{cls}</h3>
                    {stats?.marked ? (
                      <span className={styles.markedBadge}>
                        <FaCheck /> Marked
                      </span>
                    ) : (
                      <span className={styles.notMarkedBadge}>
                        <FaClock /> Not Marked
                      </span>
                    )}
                  </div>
                  
                  <div className={styles.classStats}>
                    <div className={styles.classStat}>
                      <span className={styles.classStatValue}>{stats?.totalStudents || 0}</span>
                      <span className={styles.classStatLabel}>Students</span>
                    </div>
                    <div className={styles.classStat}>
                      <span className={styles.classStatValue} style={{ color: "#22c55e" }}>{stats?.present || 0}</span>
                      <span className={styles.classStatLabel}>Present</span>
                    </div>
                    <div className={styles.classStat}>
                      <span className={styles.classStatValue} style={{ color: "#ef4444" }}>{stats?.absent || 0}</span>
                      <span className={styles.classStatLabel}>Absent</span>
                    </div>
                  </div>

                  {stats?.marked && (
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  )}

                  <div className={styles.classFooter}>
                    <span>{stats?.percentage || 0}% Attendance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Detail View */}
      {selectedClass && (
        <div className={styles.classDetailSection}>
          <div className={styles.detailHeader}>
            <button onClick={() => setSelectedClass(null)} className={styles.backBtn}>
              <FaChevronLeft /> Back to Classes
            </button>
            <h2>{selectedClass} - Attendance Details</h2>
          </div>

          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="Search by student name or ID..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={styles.resultCount}>
              Showing <strong>{filteredRecords.length}</strong> of <strong>{attendanceRecords.length}</strong> students
            </span>
            <button className={styles.printBtn} onClick={handlePrint}>
              <FaPrint /> Print Report
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <FaCalendarAlt />
              <h3>No Attendance Records</h3>
              <p>Attendance has not been marked for this class on the selected date.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <span className={styles.tableTitle}>
                  <FaUsers /> Students ({filteredRecords.length})
                </span>
                <div className={styles.tableStats}>
                  <span className={styles.presentStat}>
                    <FaCheckCircle /> {presentCount} Present
                  </span>
                  <span className={styles.absentStat}>
                    <FaTimesCircle /> {absentCount} Absent
                  </span>
                </div>
              </div>

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
                  {filteredRecords.map((record, index) => (
                    <tr key={record._id}>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentPhoto}>
                            {getInitials(record.studentName)}
                          </div>
                          <span className={styles.studentName}>{record.studentName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.studentId}>{record.studentId}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${record.status === "present" || record.status === "late" ? styles.present : styles.absent}`}>
                          {record.status === "present" ? (
                            <><FaCheckCircle /> Present</>
                          ) : record.status === "late" ? (
                            <><FaClock /> Late</>
                          ) : (
                            <><FaTimesCircle /> Absent</>
                          )}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "12px" }}>{record.teacherName || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
