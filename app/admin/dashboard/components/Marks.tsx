"use client";

import { useEffect, useState } from "react";
import { 
  FaUserGraduate, 
  FaChartLine,
  FaBook,
  FaCheckCircle, 
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaStar,
  FaAward,
  FaTrophy,
  FaMedal,
  FaUser,
  FaCalendarAlt
} from "react-icons/fa";
import styles from "@/app/styles/Overview.module.css";

interface StudentData {
  _id: string;
  studentId: string;
  studentName: string;
  email?: string;
  fatherName?: string;
  classApplying?: string;
  marksSummary: {
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
    cgpa: number;
    examCount: number;
    subjectCount: number;
  };
}

interface StudentDetail {
  student: {
    _id: string;
    studentId: string;
    name: string;
    email?: string;
    fatherName?: string;
    motherName?: string;
    phone?: string;
    class: string;
    dob?: string;
    gender?: string;
  };
  summary: {
    overallTotalMarks: number;
    overallTotalMaxMarks: number;
    overallPercentage: number;
    totalExams: number;
    totalSubjects: number;
    cgpa: number;
    grade: string;
  };
  termWiseSummary: Record<string, any>;
  subjectWiseData: Record<string, any>;
  subjects: string[];
  terms: string[];
  academicYears: string[];
}

const CLASSES = [
  "All Classes", "Nursery", "LKG", "UKG", 
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

export default function Marks() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const url = selectedClass === "All Classes" 
        ? "/api/admin/students" 
        : `/api/admin/students?class=${encodeURIComponent(selectedClass)}`;
        
      const res = await fetch(url, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}/marks`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        setLoadingDetail(false);
        return;
      }
      
      const data = await res.json();
      setStudentDetail(data);
      if (data.subjects?.length > 0) {
        setExpandedSubjects(new Set([data.subjects[0]]));
      }
    } catch (error) {
      console.error("Error fetching student detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStudentClick = (student: StudentData) => {
    setSelectedStudent(student);
    fetchStudentDetail(student.studentId);
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setStudentDetail(null);
    setExpandedSubjects(new Set());
  };

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(search) ||
      s.studentId.toLowerCase().includes(search) ||
      (s.classApplying || "").toLowerCase().includes(search)
    );
  });

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 91) return { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", label: "Outstanding" };
    if (percentage >= 81) return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", label: "Excellent" };
    if (percentage >= 71) return { bg: "rgba(132, 204, 22, 0.15)", color: "#84cc16", label: "Very Good" };
    if (percentage >= 61) return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Good" };
    if (percentage >= 51) return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", label: "Fair" };
    if (percentage >= 41) return { bg: "rgba(251, 146, 60, 0.15)", color: "#fb923c", label: "Satisfactory" };
    return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "Needs Improvement" };
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 91) return { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" };
    if (percentage >= 81) return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e" };
    if (percentage >= 71) return { bg: "rgba(132, 204, 22, 0.15)", color: "#84cc16" };
    if (percentage >= 61) return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
    if (percentage >= 51) return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" };
    if (percentage >= 41) return { bg: "rgba(251, 146, 60, 0.15)", color: "#fb923c" };
    return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 91) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff" };
    if (percentage >= 81) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff" };
    if (percentage >= 71) return { bg: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)", color: "#fff" };
    if (percentage >= 61) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" };
    if (percentage >= 51) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" };
    if (percentage >= 41) return { bg: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", color: "#fff" };
    return { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" };
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 91) return "A1";
    if (percentage >= 81) return "A2";
    if (percentage >= 71) return "B1";
    if (percentage >= 61) return "B2";
    if (percentage >= 51) return "C1";
    if (percentage >= 41) return "C2";
    return "D";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (selectedStudent && studentDetail) {
    const summaryColors = getPercentageColor(studentDetail.summary.overallPercentage);
    
    return (
      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <button 
              onClick={handleBack}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0",
                borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#64748b",
                cursor: "pointer"
              }}
            >
              <FaChevronLeft /> Back to Students
            </button>
            <h2 className={styles.sectionTitle}>
              <FaChartLine style={{ marginRight: "8px", color: "#3b82f6" }} />
              {studentDetail.student.name} - Marks & Results
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", padding: "0" }}>
            {/* Left Column - Student Info & Summary */}
            <div>
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
                marginBottom: "20px"
              }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", color: "#fff", fontSize: "28px", fontWeight: 700
                }}>
                  {getInitials(studentDetail.student.name)}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>
                  {studentDetail.student.name}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0" }}>
                  {studentDetail.student.class}
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 20px 0" }}>
                  ID: {studentDetail.student.studentId}
                </p>

                <div style={{ position: "relative", width: "150px", height: "150px", margin: "0 auto 20px" }}>
                  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke={summaryColors.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(studentDetail.summary.overallPercentage / 100) * 283} 283`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, color: summaryColors.color, display: "block" }}>
                      {studentDetail.summary.overallPercentage}%
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>Overall</span>
                  </div>
                </div>

                <div style={{ 
                  padding: "10px 16px",
                  borderRadius: "20px",
                  background: summaryColors.bg,
                  color: summaryColors.color,
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "inline-block",
                  marginBottom: "16px"
                }}>
                  {summaryColors.label}
                </div>

                <div style={{ display: "flex", justifyContent: "space-around", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: "0" }}>
                      {studentDetail.summary.totalSubjects}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>Subjects</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#8b5cf6", margin: "0" }}>
                      {studentDetail.summary.cgpa}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>CGPA</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6", margin: "0" }}>
                      {studentDetail.summary.totalExams}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>Exams</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid #e2e8f0"
              }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: "0 0 16px 0" }}>
                  Student Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0", textTransform: "uppercase" }}>Father</p>
                    <p style={{ fontSize: "13px", color: "#1e293b", margin: "4px 0 0 0", fontWeight: 600 }}>
                      {studentDetail.student.fatherName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0", textTransform: "uppercase" }}>Email</p>
                    <p style={{ fontSize: "13px", color: "#1e293b", margin: "4px 0 0 0", fontWeight: 600 }}>
                      {studentDetail.student.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0", textTransform: "uppercase" }}>Phone</p>
                    <p style={{ fontSize: "13px", color: "#1e293b", margin: "4px 0 0 0", fontWeight: 600 }}>
                      {studentDetail.student.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Subject Details */}
            <div>
              <div style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #e2e8f0"
              }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBook style={{ color: "#3b82f6" }} />
                  Subject-wise Performance
                </h4>

                {studentDetail.subjects.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                    <FaBook style={{ fontSize: "48px", color: "#e2e8f0", marginBottom: "12px" }} />
                    <p>No marks available for this student</p>
                  </div>
                ) : (
                  <div>
                    {studentDetail.subjects.map((subject) => {
                      const data = studentDetail.subjectWiseData[subject];
                      const isExpanded = expandedSubjects.has(subject);
                      const subjectColors = getPercentageColor(data?.overall?.percentage || 0);
                      
                      return (
                        <div key={subject} style={{ borderBottom: "1px solid #f1f5f9", marginBottom: "12px" }}>
                          <div 
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "16px",
                              cursor: "pointer",
                              background: isExpanded ? "#f8fafc" : "#ffffff",
                              borderRadius: "10px",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => toggleSubject(subject)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "10px",
                                background: subjectColors.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                                color: subjectColors.color
                              }}>
                                <FaBook />
                              </div>
                              <div>
                                <h5 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>{subject}</h5>
                                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                                  {data?.overall?.examCount || 0} Exams | {data?.overall?.totalMarks || 0}/{data?.overall?.totalMaxMarks || 0}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: subjectColors.bg,
                                color: subjectColors.color,
                                fontSize: "14px",
                                fontWeight: 700
                              }}>
                                {data?.overall?.percentage || 0}%
                              </span>
                              <span style={{ color: "#64748b", fontSize: "12px" }}>
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: "0 0 16px 0" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                  <tr style={{ background: "#f8fafc" }}>
                                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>Exam</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>Term</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>Marks</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>%</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>Grade</th>
                                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#64748b" }}>GP</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data?.termWise && Object.values(data.termWise).map((termData: any) => (
                                    termData.exams.map((exam: any, idx: number) => (
                                      <tr key={`${exam.examType}-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b" }}>{exam.examType}</td>
                                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b" }}>{termData.term}</td>
                                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>
                                          {exam.marks}/{exam.maxMarks}
                                        </td>
                                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>{exam.percentage}%</td>
                                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                          <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "10px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            ...getGradeBadge(exam.percentage)
                                          }}>
                                            {exam.grade}
                                          </span>
                                        </td>
                                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                                          {exam.gradePoint}
                                        </td>
                                      </tr>
                                    ))
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaChartLine style={{ marginRight: "8px", color: "#3b82f6" }} />
            Student Marks & Results
          </h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <FaFilter style={{ color: "#64748b" }} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1e293b",
                background: "#ffffff",
                cursor: "pointer"
              }}
            >
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  width: "200px",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUserGraduate className={styles.emptyIcon} />
            <p>No students found</p>
          </div>
        ) : (
          <div className={styles.admissionList}>
            {filteredStudents.map((student, index) => {
              const colors = getPercentageColor(student.marksSummary.percentage);
              return (
                <div 
                  key={student.studentId}
                  className={styles.admissionCard}
                  style={{ animationDelay: `${index * 30}ms`, cursor: "pointer" }}
                  onClick={() => handleStudentClick(student)}
                >
                  <div className={styles.admissionIcon} style={{ background: colors.bg }}>
                    <FaUser style={{ color: colors.color }} />
                  </div>
                  <div className={styles.admissionInfo}>
                    <h3>{student.studentName}</h3>
                    <p>ID: {student.studentId} | {student.classApplying}</p>
                  </div>
                  <div className={styles.admissionMeta}>
                    <div style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: 700,
                      background: colors.bg,
                      color: colors.color
                    }}>
                      {student.marksSummary.percentage}%
                    </div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaBook style={{ color: "#3b82f6", fontSize: "11px" }} />
                        {student.marksSummary.subjectCount} Sub
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaChartLine style={{ color: "#8b5cf6", fontSize: "11px" }} />
                        CGPA: {student.marksSummary.cgpa}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
