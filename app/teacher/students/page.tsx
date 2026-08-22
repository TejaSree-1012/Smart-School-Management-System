"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/students.module.css";
import { 
  FaUserGraduate, 
  FaEye, 
  FaUsers,
  FaBook,
  FaUserCircle,
  FaUserTimes,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaPrint,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaChalkboardTeacher
} from "react-icons/fa";

type Message = {
  show: boolean;
  text: string;
  type: "success" | "error";
};

export default function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<Message>({ show: false, text: "", type: "success" });
  const [teacherName, setTeacherName] = useState("Teacher");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTeacherData();
    fetchStudents();
  }, []);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage({ show: true, text, type });
    setTimeout(() => {
      setMessage({ show: false, text: "", type: "success" });
    }, 4000);
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
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/api/teachers/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.students || []);
      setClasses(data.classes || []);
      setClassCounts(data.classCounts || {});
    }
    catch (error) {
      console.error("Fetch students error:", error);
      showMessage("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  }

  const getClassCount = (className: string) => {
    if (className === "all") return students.length;
    return classCounts[className] || students.filter(s => s.classApplying === className).length;
  };

  const filtered = students.filter((s: any) => {
    const matchesClass = activeClass === "all" || s.classApplying === activeClass;
    const matchesSearch = 
      (s.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.fatherName || "").toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filtered.slice(startIndex, startIndex + itemsPerPage);

  const activeStudents = students.filter(s => s.status === "active").length;

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleExport = () => {
    const headers = ["Student ID", "Name", "Class", "Gender", "DOB", "Father Name", "Mother Name", "Email", "Phone", "Status"];
    const csvData = filtered.map(s => [
      s.studentId || "",
      s.studentName || "",
      s.classApplying || "",
      s.gender || "",
      s.dob || "",
      s.fatherName || "",
      s.motherName || "",
      s.email || "",
      s.phone || "",
      s.status || "active"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `my_students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showMessage("Student data exported successfully", "success");
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>My Students - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e3a5f; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #1e3a5f; color: white; }
            tr:nth-child(even) { background: #f8f9fa; }
            .status-active { color: green; }
            .status-inactive { color: red; }
          </style>
        </head>
        <body>
          <h1>My Students - ${teacherName}</h1>
          <p>Total Students: ${filtered.length} | Classes: ${classes.length} | Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Father</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(s => `
                <tr>
                  <td>${s.studentId || "N/A"}</td>
                  <td>${s.studentName || "N/A"}</td>
                  <td>${s.classApplying || "N/A"}</td>
                  <td>${s.fatherName || "N/A"}</td>
                  <td>${s.email || "N/A"}</td>
                  <td>${s.phone || "N/A"}</td>
                  <td class="status-${s.status || 'active'}">${s.status || "active"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
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
      
      {/* Header */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>
          <FaChalkboardTeacher />
          My Students
        </h1>
      </div>

      {/* Message Toast */}
      {message.show && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === "success" ? <FaCheck /> : <FaExclamationTriangle />}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage({ show: false, text: "", type: "success" })}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div 
          className={`${styles.statCard} ${activeClass === "all" ? styles.active : ""}`}
          onClick={() => { setActiveClass("all"); setCurrentPage(1); }}
        >
          <div className={styles.statIcon}><FaUsers /></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total</p>
            <p className={styles.statValue}>{students.length}</p>
          </div>
        </div>

        <div 
          className={`${styles.statCard} ${activeClass === "classes" ? styles.active : ""}`}
          onClick={() => { setActiveClass("classes"); setCurrentPage(1); }}
        >
          <div className={styles.statIcon}><FaBook /></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>My Classes</p>
            <p className={styles.statValue}>{classes.length}</p>
          </div>
        </div>

        <div 
          className={`${styles.statCard} ${activeClass === "active" ? styles.active : ""}`}
          onClick={() => { setActiveClass("active"); setCurrentPage(1); }}
        >
          <div className={styles.statIcon}><FaUserCircle /></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Active</p>
            <p className={styles.statValue}>{activeStudents}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaUserTimes /></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Inactive</p>
            <p className={styles.statValue}>{students.length - activeStudents}</p>
          </div>
        </div>
      </div>

      {/* Class Filter */}
      <div className={styles.classFilterSection}>
        <label className={styles.filterLabel}>Filter by Class</label>
        <div className={styles.classFilters}>
          <button
            key="all"
            className={`${styles.classFilterBtn} ${activeClass === "all" ? styles.active : ""}`}
            onClick={() => { setActiveClass("all"); setCurrentPage(1); }}
          >
            All Classes
            <span className={styles.classCount}>{getClassCount("all")}</span>
          </button>
          {classes.map((cls) => (
            <button
              key={cls}
              className={`${styles.classFilterBtn} ${activeClass === cls ? styles.active : ""}`}
              onClick={() => { setActiveClass(cls); setCurrentPage(1); }}
            >
              {cls}
              <span className={styles.classCount}>{getClassCount(cls)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchFilterRow}>
        <input
          type="text"
          placeholder="Search by name, ID, email or parent name..."
          className={styles.searchInput}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
        <span className={styles.resultCount}>
          Showing <strong>{filtered.length}</strong> of <strong>{students.length}</strong> students
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading students...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <FaUserGraduate />
          <h3>No Students Found</h3>
          <p>
            {search || activeClass !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No students are assigned to your classes yet"}
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              <FaUsers /> All Students ({teacherName})
            </span>
            <div className={styles.tableActions}>
              <button className={styles.tableActionBtn} onClick={handleExport}>
                <FaDownload /> Export CSV
              </button>
              <button className={styles.tableActionBtn} onClick={handlePrint}>
                <FaPrint /> Print
              </button>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Father Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStudents.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className={styles.studentCell}>
                      {s.studentPhoto && !photoErrors[s._id] ? (
                        <img 
                          src={s.studentPhoto} 
                          className={styles.studentPhotoSmall} 
                          alt={s.studentName}
                          onError={() => setPhotoErrors(prev => ({ ...prev, [s._id]: true }))}
                        />
                      ) : (
                        <div className={styles.studentPhotoPlaceholder}>
                          {getInitials(s.studentName)}
                        </div>
                      )}
                      <div>
                        <div className={styles.studentName}>{s.studentName}</div>
                        <div className={styles.studentEmail}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.studentId}>{s.studentId || "N/A"}</span>
                  </td>
                  <td>
                    <span className={styles.classBadge}>
                      <FaBook /> {s.classApplying || "N/A"}
                    </span>
                  </td>
                  <td>{s.gender || "N/A"}</td>
                  <td>{s.fatherName || "N/A"}</td>
                  <td>{s.phone || "N/A"}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${s.status === "active" ? styles.active : styles.inactive}`}>
                      {s.status || "active"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.viewBtn}`} 
                        title="View Details"
                        onClick={() => { setSelectedStudent(s); }}
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.tableFooter}>
            <span className={styles.paginationInfo}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 10) {
                  if (currentPage > 5) {
                    page = currentPage - 5 + i;
                    if (page > totalPages) return null;
                  }
                }
                return (
                  <button 
                    key={page}
                    className={`${styles.pageBtn} ${currentPage === page ? styles.active : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {selectedStudent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.formHeader}>
              <h2>Student Details</h2>
              <button className={styles.closeIcon} onClick={() => setSelectedStudent(null)}>✕</button>
            </div>

            <div className={styles.modalProfile}>
              <div className={styles.modalPhotoWrapper}>
                {selectedStudent.studentPhoto && !photoErrors[selectedStudent._id] ? (
                  <img 
                    src={selectedStudent.studentPhoto} 
                    className={styles.modalStudentPhoto}
                    alt={selectedStudent.studentName}
                    onError={() => setPhotoErrors(prev => ({ ...prev, [selectedStudent._id]: true }))}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
                    color: 'white',
                    fontSize: '36px',
                    fontWeight: 700,
                    borderRadius: '50%'
                  }}>
                    {getInitials(selectedStudent.studentName)}
                  </div>
                )}
              </div>
              <h3 className={styles.modalStudentName}>{selectedStudent.studentName}</h3>
              <span className={styles.modalStudentId}>{selectedStudent.studentId}</span>
            </div>

            <div className={styles.modalInfoSection}>
              <h4 className={styles.modalInfoTitle}>Personal Information</h4>
              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoItem}>
                  <span>Date of Birth</span>
                  <p>{selectedStudent.dob || "N/A"}</p>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Gender</span>
                  <p>{selectedStudent.gender || "N/A"}</p>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Class</span>
                  <p>{selectedStudent.classApplying || "N/A"}</p>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Status</span>
                  <p style={{ textTransform: "capitalize" }}>{selectedStudent.status || "active"}</p>
                </div>
              </div>
            </div>

            <div className={styles.modalInfoSection}>
              <h4 className={styles.modalInfoTitle}>Parent Information</h4>
              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoItem}>
                  <span>Father's Name</span>
                  <p>{selectedStudent.fatherName || "N/A"}</p>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Mother's Name</span>
                  <p>{selectedStudent.motherName || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className={styles.modalInfoSection}>
              <h4 className={styles.modalInfoTitle}>Contact Information</h4>
              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoItem}>
                  <span>Email</span>
                  <p>{selectedStudent.email || "N/A"}</p>
                </div>
                <div className={styles.modalInfoItem}>
                  <span>Phone</span>
                  <p>{selectedStudent.phone || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
