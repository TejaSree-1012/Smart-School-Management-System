"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "@/app/styles/StudentAttendance.module.css";
import { 
  FaChartLine,
  FaBook,
  FaUsers,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaHome,
  FaUser,
  FaStar,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaTrophy,
  FaAward,
  FaMedal
} from "react-icons/fa";

type SubjectData = {
  subject: string;
  termWise: Record<string, {
    term: string;
    exams: Array<{
      examType: string;
      marks: number;
      maxMarks: number;
      grade: string;
      gradePoint: number;
      percentage: number;
    }>;
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
  }>;
  overall: {
    totalMarks: number;
    totalMaxMarks: number;
    percentage: number;
    examCount: number;
  };
};

type Summary = {
  overallTotalMarks: number;
  overallTotalMaxMarks: number;
  overallPercentage: number;
  totalExams: number;
  totalSubjects: number;
  cgpa: number;
  grade: string;
};

type TermSummary = {
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  examCount: number;
  subjectCount: number;
};

export default function ParentMarks() {
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("Parent");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [childId, setChildId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subjectWiseData, setSubjectWiseData] = useState<Record<string, SubjectData>>({});
  const [termWiseSummary, setTermWiseSummary] = useState<Record<string, TermSummary>>({});
  const [subjects, setSubjects] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParentData();
    fetchMarks();
  }, []);

  async function fetchParentData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Error fetching auth data:", data.error);
        setLoading(false);
        return;
      }
      
      if (data.user) {
        setParentName(data.user.name || "Parent");
        setChildName(data.user.studentName || "");
        setChildClass(data.user.studentClass || "");
        setChildId(data.user.studentId || "");
      }
    } catch (error) {
      console.error("Error fetching parent data:", error);
      setLoading(false);
    }
  }

  async function fetchMarks() {
    if (!childId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append("studentId", childId);
      if (selectedTerm) params.append("term", selectedTerm);
      if (selectedAcademicYear) params.append("academicYear", selectedAcademicYear);
      
      const res = await fetch(`/api/parent/marks?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view marks");
        } else {
          setError("Failed to load marks data");
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      
      setSummary(data.summary);
      setSubjectWiseData(data.subjectWiseData || {});
      setTermWiseSummary(data.termSummary || {});
      setSubjects(data.subjects || []);
      setTerms(data.terms || []);
      setAcademicYears(data.academicYears || []);
      
      if (data.subjects?.length > 0) {
        setExpandedSubjects(new Set([data.subjects[0]]));
      }
    } catch (error) {
      console.error("Error fetching marks:", error);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 91) return { bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e", label: "Outstanding" };
    if (percentage >= 81) return { bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08))", color: "#22c55e", label: "Excellent" };
    if (percentage >= 71) return { bg: "linear-gradient(135deg, rgba(132, 204, 22, 0.15), rgba(132, 204, 22, 0.1))", color: "#84cc16", label: "Very Good" };
    if (percentage >= 61) return { bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))", color: "#f59e0b", label: "Good" };
    if (percentage >= 51) return { bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08))", color: "#f59e0b", label: "Fair" };
    if (percentage >= 41) return { bg: "linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.1))", color: "#fb923c", label: "Satisfactory" };
    return { bg: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))", color: "#ef4444", label: "Needs Improvement" };
  };

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith("A")) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff" };
    if (grade.startsWith("B")) return { bg: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)", color: "#fff" };
    if (grade.startsWith("C")) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" };
    if (grade.startsWith("D")) return { bg: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", color: "#fff" };
    return { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" };
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading marks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <FaHome className={styles.breadcrumbIcon} />
              <span>Parent Portal</span>
            </div>
            <h1 className={styles.title}>{childName}&apos;s Marks</h1>
            <p className={styles.subtitle}>View academic performance</p>
          </div>
        </div>
        <div className={styles.errorContainer}>
          <FaExclamationTriangle style={{ fontSize: "48px", color: "#ef4444", marginBottom: "16px" }} />
          <h2>Error Loading Marks</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!summary || subjects.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <FaHome className={styles.breadcrumbIcon} />
              <span>Parent Portal</span>
            </div>
            <h1 className={styles.title}>{childName}&apos;s Marks</h1>
            <p className={styles.subtitle}>View academic performance</p>
          </div>
        </div>
        <div className={styles.emptyContainer}>
          <FaChartLine style={{ fontSize: "64px", color: "#e2e8f0", marginBottom: "16px" }} />
          <h2>No Marks Available</h2>
          <p>Marks will appear here once published.</p>
        </div>
      </div>
    );
  }

  const gradeColors = getGradeColor(summary.overallPercentage);

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
            <h1 className={styles.title}>{childName}&apos;s Marks & Results</h1>
            <p className={styles.subtitle}>Track academic performance</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.dateTimeBox}>
              <div className={styles.dateBox}>
                <FaCalendarAlt className={styles.dateIcon} />
                <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className={styles.contentGrid}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className={styles.percentageCard}>
          <div className={styles.percentageHeader}>
            <div className={styles.percentageIcon} style={{ background: gradeColors.bg, color: gradeColors.color }}>
              <FaTrophy />
            </div>
            <h2>Overall Performance</h2>
          </div>
          
          <div className={styles.percentageDisplay}>
            <div className={styles.percentageCircle}>
              <svg viewBox="0 0 100 100" className={styles.percentageSvg}>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={gradeColors.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(summary.overallPercentage / 100) * 283} 283`}
                  transform="rotate(-90 50 50)"
                  className={styles.percentageProgress}
                />
              </svg>
              <div className={styles.percentageValue}>
                <span className={styles.percentageNumber} style={{ color: gradeColors.color }}>
                  {summary.overallPercentage}%
                </span>
                <span className={styles.percentageLabel}>Overall</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: gradeColors.color, margin: 0 }}>
              {gradeColors.label}
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
              Grade: <strong style={{ color: "#1e293b" }}>{summary.grade.split(" - ")[0]}</strong>
            </p>
          </div>

          <div className={styles.percentageStats}>
            <div className={styles.miniStat}>
              <FaBook style={{ color: "#3b82f6" }} />
              <span>Subjects: <strong>{summary.totalSubjects}</strong></span>
            </div>
            <div className={styles.miniStat}>
              <FaAward style={{ color: "#8b5cf6" }} />
              <span>CGPA: <strong>{summary.cgpa}</strong></span>
            </div>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.blue}`}>
                <FaChartLine />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Total Marks</p>
                <p className={styles.summaryValue}>{summary.overallTotalMarks}/{summary.overallTotalMaxMarks}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.green}`}>
                <FaCheckCircle />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Exams Attended</p>
                <p className={styles.summaryValue}>{summary.totalExams}</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.red}`}>
                <FaBook />
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>Subjects</p>
                <p className={styles.summaryValue}>{summary.totalSubjects}</p>
              </div>
            </div>
          </div>

          <div className={styles.studentInfo}>
            <div className={styles.studentAvatar}>
              <FaUser />
            </div>
            <div className={styles.studentDetails}>
              <h3>{childName}</h3>
              <p>{childClass} | ID: {childId}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className={styles.calendarSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={`${styles.sectionIcon} ${styles.green}`}>
                <FaBook />
              </div>
              <div className={styles.sectionInfo}>
                <h2>Subject-wise Performance</h2>
                <p>Detailed marks for each subject</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "0" }}>
            {subjects.map((subject) => {
              const data = subjectWiseData[subject];
              const isExpanded = expandedSubjects.has(subject);
              const subjectGradeColors = getGradeColor(data?.overall?.percentage || 0);
              
              return (
                <div 
                  key={subject}
                  style={{
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 24px",
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                      background: isExpanded ? "#f8fafc" : "#ffffff"
                    }}
                    onClick={() => toggleSubject(subject)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: subjectGradeColors.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: subjectGradeColors.color
                      }}>
                        <FaBook />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                          {subject}
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                          {data?.overall?.examCount || 0} Examinations | {data?.overall?.totalMarks || 0}/{data?.overall?.totalMaxMarks || 0} Marks
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          padding: "6px 16px",
                          borderRadius: "20px",
                          background: subjectGradeColors.bg,
                          color: subjectGradeColors.color,
                          fontSize: "14px",
                          fontWeight: 700
                        }}>
                          {data?.overall?.percentage || 0}%
                        </div>
                      </div>
                      {isExpanded ? (
                        <FaChevronUp style={{ color: "#64748b" }} />
                      ) : (
                        <FaChevronDown style={{ color: "#64748b" }} />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ padding: "0 24px 20px 24px" }}
                    >
                      <div style={{ 
                        background: "#f8fafc", 
                        borderRadius: "12px", 
                        padding: "16px",
                        overflowX: "auto"
                      }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Examination
                              </th>
                              <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Term
                              </th>
                              <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Marks
                              </th>
                              <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Percentage
                              </th>
                              <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Grade
                              </th>
                              <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>
                                Grade Point
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data?.termWise && Object.values(data.termWise).map((termData: any) => (
                              termData.exams.map((exam: any, idx: number) => (
                                <tr key={`${exam.examType}-${exam.grade}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                    {exam.examType}
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                                    {termData.term}
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                    {exam.marks}/{exam.maxMarks}
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                    {exam.percentage}%
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center" }}>
                                    <span style={{
                                      padding: "4px 12px",
                                      borderRadius: "12px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      ...getGradeBadge(exam.grade)
                                    }}>
                                      {exam.grade}
                                    </span>
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                                    {exam.gradePoint}
                                  </td>
                                </tr>
                              ))
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#ffffff" }}>
                              <td colSpan={2} style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: "#1e293b", borderTop: "2px solid #e2e8f0" }}>
                                Total ({data?.overall?.examCount || 0} Exams)
                              </td>
                              <td style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#1e293b", borderTop: "2px solid #e2e8f0" }}>
                                {data?.overall?.totalMarks || 0}/{data?.overall?.totalMaxMarks || 0}
                              </td>
                              <td style={{ padding: "12px", textAlign: "center", fontSize: "14px", fontWeight: 700, color: subjectGradeColors.color, borderTop: "2px solid #e2e8f0" }}>
                                {data?.overall?.percentage || 0}%
                              </td>
                              <td colSpan={2} style={{ padding: "12px", textAlign: "center", borderTop: "2px solid #e2e8f0" }}>
                                <span style={{
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  ...getGradeBadge(data?.overall?.percentage >= 91 ? "A1" : data?.overall?.percentage >= 81 ? "A2" : data?.overall?.percentage >= 71 ? "B1" : data?.overall?.percentage >= 61 ? "B2" : data?.overall?.percentage >= 51 ? "C1" : data?.overall?.percentage >= 41 ? "C2" : "D")
                                }}>
                                  {data?.overall?.percentage >= 91 ? "A1" : 
                                   data?.overall?.percentage >= 81 ? "A2" : 
                                   data?.overall?.percentage >= 71 ? "B1" : 
                                   data?.overall?.percentage >= 61 ? "B2" : 
                                   data?.overall?.percentage >= 51 ? "C1" : 
                                   data?.overall?.percentage >= 41 ? "C2" : "D"}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div 
        className={styles.absentSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <div className={`${styles.sectionIcon} ${styles.blue}`}>
                <FaMedal />
              </div>
              <div className={styles.sectionInfo}>
                <h2>Grading Scale</h2>
                <p>CBSE Pattern Grade System</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            {[
              { grade: "A1", range: "91-100%", color: "#22c55e", point: "10" },
              { grade: "A2", range: "81-90%", color: "#22c55e", point: "9" },
              { grade: "B1", range: "71-80%", color: "#84cc16", point: "8" },
              { grade: "B2", range: "61-70%", color: "#84cc16", point: "7" },
              { grade: "C1", range: "51-60%", color: "#f59e0b", point: "6" },
              { grade: "C2", range: "41-50%", color: "#fb923c", point: "5" },
              { grade: "D", range: "33-40%", color: "#fb923c", point: "4" },
              { grade: "E", range: "Below 33", color: "#ef4444", point: "0" },
            ].map((item) => (
              <div 
                key={item.grade}
                style={{
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 700, color: item.color }}>
                  {item.grade}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {item.range}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>
                  GP: {item.point}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}