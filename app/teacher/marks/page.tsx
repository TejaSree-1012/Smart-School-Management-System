"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/students.module.css";
import { 
  FaChartLine,
  FaBook,
  FaUsers,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPrint,
  FaDownload,
  FaHome,
  FaUser,
  FaStar
} from "react-icons/fa";

type Student = {
  _id: string;
  studentId: string;
  studentName: string;
  email?: string;
  fatherName?: string;
  classApplying?: string;
  teachingSubjects?: string[];
};

type MarkRecord = {
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  examType: string;
  term: string;
  academicYear: string;
  marks: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  teacherName?: string;
  createdAt?: string;
};

type Message = {
  show: boolean;
  text: string;
  type: "success" | "error" | "warning";
};

const EXAM_TYPES = [
  { value: "Periodic Test 1", label: "Periodic Test 1", maxMarks: 20 },
  { value: "Periodic Test 2", label: "Periodic Test 2", maxMarks: 20 },
  { value: "Periodic Test 3", label: "Periodic Test 3", maxMarks: 20 },
  { value: "Half Yearly Exam", label: "Half Yearly Exam", maxMarks: 80 },
  { value: "Annual Exam", label: "Annual Exam", maxMarks: 80 },
  { value: "Unit Test 1", label: "Unit Test 1", maxMarks: 30 },
  { value: "Unit Test 2", label: "Unit Test 2", maxMarks: 30 },
  { value: "Unit Test 3", label: "Unit Test 3", maxMarks: 30 },
  { value: "Subject Enrichment", label: "Subject Enrichment", maxMarks: 10 },
  { value: "Portfolio", label: "Portfolio", maxMarks: 10 },
  { value: "Multiple Assessment", label: "Multiple Assessment", maxMarks: 10 },
  { value: "Quiz", label: "Quiz", maxMarks: 10 }
];

const TERMS = ["Term 1", "Term 2", "Term 3"];
const ACADEMIC_YEARS = ["2025-2026", "2026-2027"];

export default function TeacherMarks() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("Term 1");
  const [selectedExamType, setSelectedExamType] = useState<string>("Periodic Test 1");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("2025-2026");
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [marksData, setMarksData] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<Message>({ show: false, text: "", type: "success" });
  const [teacherName, setTeacherName] = useState("Teacher");
  const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});
  const [savedMarks, setSavedMarks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"entry" | "records">("entry");
  const [existingMarks, setExistingMarks] = useState<MarkRecord[]>([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudents();
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    const exam = EXAM_TYPES.find(e => e.value === selectedExamType);
    if (exam) {
      setMaxMarks(exam.maxMarks);
    }
  }, [selectedExamType]);

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
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    }
  }

  async function fetchClassesAndSubjects() {
    try {
      setLoading(true);
      const res = await fetch("/api/teachers/marks", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        if (data.classes?.length > 0) {
          setSelectedClass(data.classes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubjects() {
    try {
      const res = await fetch(`/api/teachers/marks?class=${encodeURIComponent(selectedClass)}&mode=subjects`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
        if (data.subjects?.length > 0) {
          setSelectedSubject(data.subjects[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }

  async function fetchStudents() {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers/marks?class=${encodeURIComponent(selectedClass)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        
        const initialMarks: Record<string, number> = {};
        data.students.forEach((s: Student) => {
          initialMarks[s.studentId] = 0;
        });
        setMarksData(initialMarks);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExistingMarks() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        class: selectedClass,
        subject: selectedSubject,
        term: selectedTerm,
        examType: selectedExamType,
        academicYear: selectedAcademicYear,
        mode: "existing"
      });
      
      const res = await fetch(`/api/teachers/marks?${params}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setExistingMarks(data.marks || []);
        
        const initialMarks: Record<string, number> = {};
        const saved = new Set<string>();
        
        data.marks?.forEach((m: MarkRecord) => {
          initialMarks[m.studentId] = m.marks;
          saved.add(m.studentId);
        });
        
        setMarksData(initialMarks);
        setSavedMarks(saved);
      }
    } catch (error) {
      console.error("Error fetching marks:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setMarksData(prev => ({ ...prev, [studentId]: numValue }));
    setSavedMarks(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const getGradeInfo = (marks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 91) return { grade: "A1", gradePoint: 10, color: "#22c55e" };
    if (percentage >= 81) return { grade: "A2", gradePoint: 9, color: "#84cc16" };
    if (percentage >= 71) return { grade: "B1", gradePoint: 8, color: "#84cc16" };
    if (percentage >= 61) return { grade: "B2", gradePoint: 7, color: "#eab308" };
    if (percentage >= 51) return { grade: "C1", gradePoint: 6, color: "#f59e0b" };
    if (percentage >= 41) return { grade: "C2", gradePoint: 5, color: "#f59e0b" };
    if (percentage >= 33) return { grade: "D", gradePoint: 4, color: "#ef4444" };
    return { grade: "E", gradePoint: 0, color: "#ef4444" };
  };

  const handleSubmit = async () => {
    const marksRecords = students
      .filter(s => marksData[s.studentId] !== undefined)
      .map(s => ({
        studentId: s.studentId,
        studentName: s.studentName,
        className: selectedClass,
        subject: selectedSubject,
        examType: selectedExamType,
        term: selectedTerm,
        academicYear: selectedAcademicYear,
        marks: marksData[s.studentId],
        maxMarks
      }));

    if (marksRecords.length === 0) {
      showMessage("Please enter marks for at least one student", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/teachers/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marksRecords })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to save marks");
      }

      showMessage(data.message, "success");
      setSavedMarks(new Set(students.map(s => s.studentId)));
      
      if (data.errors?.length > 0) {
        showMessage(`${data.errors.length} records failed to save`, "warning");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      showMessage(error.message || "Failed to save marks", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAll = () => {
    const marks: Record<string, number> = {};
    students.forEach(s => {
      marks[s.studentId] = 0;
    });
    setMarksData(marks);
    setSavedMarks(new Set());
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (s.studentName || "").toLowerCase().includes(searchLower) ||
      (s.studentId || "").toLowerCase().includes(searchLower) ||
      (s.fatherName || "").toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    if (classes.length === 0) {
      fetchClassesAndSubjects();
    }
  }, []);

  useEffect(() => {
    if (viewMode === "records" && selectedClass && selectedSubject) {
      fetchExistingMarks();
    }
  }, [viewMode, selectedClass, selectedSubject, selectedTerm, selectedExamType, selectedAcademicYear]);

  const handleExport = () => {
    const headers = ["S.No", "Student ID", "Student Name", "Marks", "Max Marks", "Percentage", "Grade"];
    const csvData = filteredStudents.map((s, i) => {
      const marks = marksData[s.studentId] || 0;
      const percentage = Math.round((marks / maxMarks) * 100);
      const gradeInfo = getGradeInfo(marks);
      return [
        i + 1,
        s.studentId,
        s.studentName,
        marks,
        maxMarks,
        `${percentage}%`,
        gradeInfo.grade
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedSubject}_${selectedExamType}_${selectedTerm}_${selectedAcademicYear}.csv`;
    link.click();
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
              background: "rgba(34, 197, 94, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FaChartLine style={{ color: "#22c55e", fontSize: "28px" }}/>
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px 0" }}>
                Smart School Management System
              </p>
              <h1 style={{ color: "#ffffff", fontSize: "24px", fontWeight: 700, margin: 0 }}>
                Student Marks Management
              </h1>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0 }}>
            Record and manage examination marks for assigned subjects and classes
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
              Assigned By
            </p>
            <p style={{ color: "#1e3a5f", fontWeight: 600, fontSize: "14px", margin: 0 }}>{teacherName}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ color: "#3b82f6", fontSize: "18px", fontWeight: 700, margin: 0 }}>{classes.length}</p>
            <p style={{ color: "#64748b", fontSize: "10px", fontWeight: 600, margin: 0 }}>Classes</p>
          </div>
          <div style={{
            background: "rgba(139, 92, 246, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ color: "#8b5cf6", fontSize: "18px", fontWeight: 700, margin: 0 }}>{subjects.length}</p>
            <p style={{ color: "#64748b", fontSize: "10px", fontWeight: 600, margin: 0 }}>Subjects</p>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message.show && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage({ show: false, text: "", type: "success" })}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Mode Toggle */}
      <div className={styles.classFilterSection}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
            <button
              onClick={() => setViewMode("entry")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "entry" ? "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)" : "transparent",
                color: viewMode === "entry" ? "#fff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              <FaSave style={{ marginRight: "6px" }} /> Enter Marks
            </button>
            <button
              onClick={() => setViewMode("records")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "records" ? "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)" : "transparent",
                color: viewMode === "records" ? "#fff" : "#64748b",
                transition: "all 0.2s ease"
              }}
            >
              <FaBook style={{ marginRight: "6px" }} /> View Records
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.classFilterSection}>
        <label className={styles.filterLabel}>Select Exam Details</label>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer",
              minWidth: "140px"
            }}
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer",
              minWidth: "160px"
            }}
          >
            <option value="">Select Subject</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer",
              minWidth: "120px"
            }}
          >
            {TERMS.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>

          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer",
              minWidth: "180px"
            }}
          >
            {EXAM_TYPES.map(exam => (
              <option key={exam.value} value={exam.value}>{exam.label}</option>
            ))}
          </select>

          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "2px solid #e2e8f0",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e3a5f",
              background: "#fff",
              cursor: "pointer",
              minWidth: "140px"
            }}
          >
            {ACADEMIC_YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          marginTop: "16px", 
          padding: "12px 16px", 
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))",
          borderRadius: "10px",
          border: "1px solid rgba(59, 130, 246, 0.2)"
        }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e3a5f", fontWeight: 600 }}>
            <FaStar style={{ color: "#f59e0b", marginRight: "8px" }} />
            Exam: <strong>{selectedExamType}</strong> | Max Marks: <strong>{maxMarks}</strong> | 
            Subject: <strong>{selectedSubject || "Not Selected"}</strong>
          </p>
        </div>
      </div>

      {/* Search */}
      {selectedClass && selectedSubject && (
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
          <button className={styles.tableActionBtn} onClick={handleExport} style={{ marginLeft: "auto" }}>
            <FaDownload /> Export
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading students...</p>
        </div>
      ) : !selectedClass || !selectedSubject ? (
        <div className={styles.emptyState}>
          <FaChartLine />
          <h3>Select Class & Subject</h3>
          <p>Please select a class and subject to view students</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className={styles.emptyState}>
          <FaUsers />
          <h3>No Students Found</h3>
          <p>No students are enrolled in this class</p>
        </div>
      ) : viewMode === "entry" ? (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>
                <FaUsers /> Enter Marks - {selectedSubject}
              </span>
              <div className={styles.tableActions}>
                <button 
                  className={styles.tableActionBtn} 
                  onClick={handleFillAll}
                  style={{ color: "#64748b" }}
                >
                  <FaTimes /> Clear All
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>S.No</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Class</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Marks (/{maxMarks})</th>
                  <th style={{ width: "100px", textAlign: "center" }}>Grade</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s, index) => {
                  const marks = marksData[s.studentId] || 0;
                  const gradeInfo = getGradeInfo(marks);
                  const isSaved = savedMarks.has(s.studentId);
                  
                  return (
                    <tr key={s._id}>
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
                        <span className={styles.studentId}>{s.studentId}</span>
                      </td>
                      <td>
                        <span className={styles.classBadge}>
                          <FaBook /> {s.classApplying}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={marks || ""}
                          onChange={(e) => handleMarksChange(s.studentId, e.target.value)}
                          placeholder="0"
                          style={{
                            width: "80px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: `2px solid ${marks > maxMarks ? "#ef4444" : "#e2e8f0"}`,
                            fontSize: "14px",
                            fontWeight: 600,
                            textAlign: "center",
                            outline: "none"
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 700,
                          background: `${gradeInfo.color}20`,
                          color: gradeInfo.color
                        }}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {isSaved ? (
                          <FaCheckCircle style={{ color: "#22c55e", fontSize: "18px" }} />
                        ) : marks > 0 ? (
                          <FaExclamationTriangle style={{ color: "#f59e0b", fontSize: "18px" }} />
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "11px" }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                {savedMarks.size} already saved, {students.length - savedMarks.size} pending
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
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
              <FaSave /> {submitting ? "Saving..." : "Save All Marks"}
            </button>
          </div>
        </>
      ) : (
        /* View Records Mode */
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              <FaBook /> Saved Records - {selectedSubject}
            </span>
            <div className={styles.tableActions}>
              <button className={styles.tableActionBtn} onClick={handleExport}>
                <FaDownload /> Export
              </button>
            </div>
          </div>

          {existingMarks.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <FaExclamationTriangle style={{ fontSize: "48px", color: "#f59e0b", marginBottom: "16px" }} />
              <h3 style={{ fontSize: "18px", color: "#1e293b", margin: "0 0 8px 0" }}>No Records Found</h3>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                No marks have been saved for this exam yet.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Teacher</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {existingMarks.map((record, index) => {
                  const gradeInfo = getGradeInfo(record.marks);
                  return (
                    <tr key={record.studentId}>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "#64748b" }}>{index + 1}</td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentPhotoPlaceholder}>
                            {getInitials(record.studentName)}
                          </div>
                          <span className={styles.studentName}>{record.studentName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.studentId}>{record.studentId}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {record.marks}/{record.maxMarks}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 700,
                          background: `${gradeInfo.color}20`,
                          color: gradeInfo.color
                        }}>
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "12px" }}>{record.teacherName || "N/A"}</td>
                      <td style={{ color: "#64748b", fontSize: "12px" }}>
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
