"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/MarksAdmin.module.css";
import { 
  FaChartLine,
  FaAward,
  FaUsers,
  FaBook,
  FaGraduationCap,
  FaTrophy,
  FaMedal,
  FaStar,
  FaFilter,
  FaPrint,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaBars,
  FaThLarge,
  FaPercent,
  FaExclamationTriangle,
  FaChartBar,
  FaChartPie
} from "react-icons/fa";

interface SchoolStats {
  totalStudents: number;
  studentsWithMarks: number;
  totalExams: number;
  averagePercentage: number;
  averageCgpa: number;
  gradeDistribution: Record<string, number>;
}

interface ClassStats {
  className: string;
  totalStudents: number;
  studentsWithMarks: number;
  averagePercentage: number;
  averageCgpa: number;
  totalExams: number;
  subjectCount: number;
  termCount: number;
  passCount: number;
  passRate: number;
  totalMarks: number;
  totalMaxMarks: number;
}

interface SubjectStats {
  subject: string;
  averagePercentage: number;
  totalExams: number;
  studentCount: number;
  totalMarks: number;
  totalMaxMarks: number;
}

type ViewMode = "overview" | "class" | "subject" | "grades";

export default function AdminMarks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [term, setTerm] = useState<string>("All Terms");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedClass, setSelectedClass] = useState<ClassStats | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "averagePercentage", direction: "desc" });
  const [expandedGrades, setExpandedGrades] = useState(false);

  useEffect(() => {
    fetchData();
  }, [academicYear, term]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (academicYear) params.set("academicYear", academicYear);
      if (term !== "All Terms") params.set("term", term);
      
      const res = await fetch(`/api/admin/marks?${params.toString()}`, {
        credentials: "include"
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in as admin");
        } else {
          setError("Failed to load marks data");
        }
        return;
      }

      const data = await res.json();
      setSchoolStats(data.schoolStats);
      setClassStats(data.classStats || []);
      setSubjectStats(data.subjectStats || []);
    } catch (err) {
      console.error("Error fetching marks data:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 91) return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", label: "Outstanding" };
    if (percentage >= 81) return { bg: "rgba(34, 197, 94, 0.10)", color: "#22c55e", label: "Excellent" };
    if (percentage >= 71) return { bg: "rgba(132, 204, 22, 0.12)", color: "#84cc16", label: "Very Good" };
    if (percentage >= 61) return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", label: "Good" };
    if (percentage >= 51) return { bg: "rgba(245, 158, 11, 0.10)", color: "#f59e0b", label: "Fair" };
    if (percentage >= 41) return { bg: "rgba(251, 146, 60, 0.12)", color: "#fb923c", label: "Satisfactory" };
    return { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", label: "Needs Improvement" };
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 91) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff", grade: "A1" };
    if (percentage >= 81) return { bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff", grade: "A2" };
    if (percentage >= 71) return { bg: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)", color: "#fff", grade: "B1" };
    if (percentage >= 61) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", grade: "B2" };
    if (percentage >= 51) return { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", grade: "C1" };
    if (percentage >= 41) return { bg: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", color: "#fff", grade: "C2" };
    return { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", grade: "D/E" };
  };

  const getGradeDistributionData = () => {
    if (!schoolStats) return [];
    const total = Object.values(schoolStats.gradeDistribution).reduce((a, b) => a + b, 0);
    return [
      { grade: "A1", label: "91-100%", count: schoolStats.gradeDistribution["A1"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["A1"] / total) * 100) : 0, color: "#22c55e" },
      { grade: "A2", label: "81-90%", count: schoolStats.gradeDistribution["A2"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["A2"] / total) * 100) : 0, color: "#22c55e" },
      { grade: "B1", label: "71-80%", count: schoolStats.gradeDistribution["B1"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["B1"] / total) * 100) : 0, color: "#84cc16" },
      { grade: "B2", label: "61-70%", count: schoolStats.gradeDistribution["B2"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["B2"] / total) * 100) : 0, color: "#f59e0b" },
      { grade: "C1", label: "51-60%", count: schoolStats.gradeDistribution["C1"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["C1"] / total) * 100) : 0, color: "#f59e0b" },
      { grade: "C2", label: "41-50%", count: schoolStats.gradeDistribution["C2"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["C2"] / total) * 100) : 0, color: "#fb923c" },
      { grade: "D", label: "33-40%", count: schoolStats.gradeDistribution["D"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["D"] / total) * 100) : 0, color: "#f97316" },
      { grade: "E", label: "Below 33%", count: schoolStats.gradeDistribution["E"], percentage: total > 0 ? Math.round((schoolStats.gradeDistribution["E"] / total) * 100) : 0, color: "#ef4444" },
    ];
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const sortedClassStats = [...classStats].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof ClassStats];
    const bVal = b[sortConfig.key as keyof ClassStats];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortConfig.direction === "asc" 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const sortedSubjectStats = [...subjectStats].sort((a, b) => {
    return sortConfig.direction === "asc" 
      ? a.averagePercentage - b.averagePercentage 
      : b.averagePercentage - a.averagePercentage;
  });

  const handleExport = () => {
    const headers = ["Class", "Total Students", "With Marks", "Avg %", "CGPA", "Exams", "Pass Rate %"];
    const csvData = sortedClassStats.map(c => [
      c.className,
      c.totalStudents,
      c.studentsWithMarks,
      c.averagePercentage,
      c.averageCgpa,
      c.totalExams,
      c.passRate
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `class_marks_report_${academicYear}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !schoolStats) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading marks data...</p>
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
          <h1 className={styles.title}>
            <FaChartLine />
            Academic Performance
          </h1>
          <p className={styles.subtitle}>Monitor and analyze student academic performance across all classes</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterGroup}>
            <FaFilter className={styles.filterIcon} />
            <select 
              className={styles.filterSelect}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="All Terms">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* School Overview Stats */}
      {schoolStats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))", color: "#3b82f6" }}>
              <FaUsers />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Students</p>
              <p className={styles.statValue}>{schoolStats.totalStudents}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))", color: "#22c55e" }}>
              <FaGraduationCap />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Students with Marks</p>
              <p className={styles.statValue}>{schoolStats.studentsWithMarks}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.1))", color: "#8b5cf6" }}>
              <FaChartLine />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>School Average</p>
              <p className={styles.statValue}>{schoolStats.averagePercentage}%</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.1))", color: "#f59e0b" }}>
              <FaAward />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Average CGPA</p>
              <p className={styles.statValue}>{schoolStats.averageCgpa}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.1))", color: "#ec4899" }}>
              <FaBook />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Exams</p>
              <p className={styles.statValue}>{schoolStats.totalExams}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.1))", color: "#14b8a6" }}>
              <FaTrophy />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Top Grade %</p>
              <p className={styles.statValue}>
                {schoolStats.totalExams > 0 
                  ? Math.round(((schoolStats.gradeDistribution["A1"] + schoolStats.gradeDistribution["A2"]) / schoolStats.totalExams) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className={styles.viewTabs}>
        <button 
          className={`${styles.viewTab} ${viewMode === "overview" ? styles.activeTab : ""}`}
          onClick={() => { setViewMode("overview"); setSelectedClass(null); setSelectedSubject(null); }}
        >
          <FaThLarge /> Overview
        </button>
        <button 
          className={`${styles.viewTab} ${viewMode === "class" ? styles.activeTab : ""}`}
          onClick={() => { setViewMode("class"); setSelectedSubject(null); }}
        >
          <FaBars /> Class-wise
        </button>
        <button 
          className={`${styles.viewTab} ${viewMode === "subject" ? styles.activeTab : ""}`}
          onClick={() => { setViewMode("subject"); setSelectedClass(null); }}
        >
          <FaBook /> Subject-wise
        </button>
        <button 
          className={`${styles.viewTab} ${viewMode === "grades" ? styles.activeTab : ""}`}
          onClick={() => { setViewMode("grades"); setSelectedClass(null); setSelectedSubject(null); }}
        >
          <FaChartPie /> Grade Distribution
        </button>
      </div>

      {/* Overview View */}
      {viewMode === "overview" && (
        <div className={styles.overviewSection}>
          {/* Top Performing Classes */}
          <div className={styles.overviewCard}>
            <div className={styles.cardHeader}>
              <h3><FaTrophy style={{ color: "#f59e0b" }} /> Top Performing Classes</h3>
            </div>
            <div className={styles.topClassesList}>
              {sortedClassStats.filter(c => c.studentsWithMarks > 0).slice(0, 5).map((cls, idx) => {
                const colors = getGradeColor(cls.averagePercentage);
                return (
                  <div key={cls.className} className={styles.topClassItem}>
                    <div className={styles.rankBadge} style={{ background: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7f32" : "#e2e8f0", color: idx < 3 ? "#fff" : "#64748b" }}>
                      #{idx + 1}
                    </div>
                    <div className={styles.topClassInfo}>
                      <span className={styles.topClassName}>{cls.className}</span>
                      <span className={styles.topClassMeta}>{cls.studentsWithMarks} students | {cls.subjectCount} subjects</span>
                    </div>
                    <div className={styles.topClassScore}>
                      <span className={styles.scoreValue} style={{ color: colors.color }}>{cls.averagePercentage}%</span>
                      <span className={styles.scoreLabel}>Average</span>
                    </div>
                  </div>
                );
              })}
              {sortedClassStats.filter(c => c.studentsWithMarks > 0).length === 0 && (
                <div className={styles.emptyMessage}>No marks data available</div>
              )}
            </div>
          </div>

          {/* Grade Distribution Summary */}
          <div className={styles.overviewCard}>
            <div className={styles.cardHeader}>
              <h3><FaChartBar style={{ color: "#8b5cf6" }} /> Performance Overview</h3>
            </div>
            <div className={styles.gradeBars}>
              {getGradeDistributionData().map((grade) => (
                <div key={grade.grade} className={styles.gradeBarItem}>
                  <div className={styles.gradeBarLabel}>
                    <span className={styles.gradeName}>{grade.grade}</span>
                    <span className={styles.gradePercent}>{grade.percentage}%</span>
                  </div>
                  <div className={styles.gradeBarOuter}>
                    <div 
                      className={styles.gradeBarInner}
                      style={{ width: `${grade.percentage}%`, background: grade.color }}
                    ></div>
                  </div>
                  <span className={styles.gradeCount}>{grade.count} exams</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStatsGrid}>
            <div className={styles.quickStatCard} style={{ borderLeft: "4px solid #22c55e" }}>
              <FaCheckCircle style={{ color: "#22c55e", fontSize: "24px" }} />
              <div>
                <span className={styles.quickStatValue}>
                  {classStats.filter(c => c.averagePercentage >= 75).length}
                </span>
                <span className={styles.quickStatLabel}>Classes Above 75%</span>
              </div>
            </div>
            <div className={styles.quickStatCard} style={{ borderLeft: "4px solid #f59e0b" }}>
              <FaMedal style={{ color: "#f59e0b", fontSize: "24px" }} />
              <div>
                <span className={styles.quickStatValue}>
                  {Math.round(classStats.reduce((sum, c) => sum + c.averagePercentage, 0) / (classStats.length || 1))}%
                </span>
                <span className={styles.quickStatLabel}>Overall Average</span>
              </div>
            </div>
            <div className={styles.quickStatCard} style={{ borderLeft: "4px solid #3b82f6" }}>
              <FaStar style={{ color: "#3b82f6", fontSize: "24px" }} />
              <div>
                <span className={styles.quickStatValue}>
                  {classStats.filter(c => c.passRate >= 90).length}
                </span>
                <span className={styles.quickStatLabel}>Classes with 90%+ Pass</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class-wise View */}
      {viewMode === "class" && !selectedClass && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              <FaBars /> Class-wise Performance
            </h2>
            <div className={styles.tableActions}>
              <button className={styles.actionBtn} onClick={handleExport}>
                <FaDownload /> Export
              </button>
              <button className={styles.actionBtn} onClick={handlePrint}>
                <FaPrint /> Print
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortableHeader} onClick={() => handleSort("className")}>
                    Class 
                    {sortConfig.key === "className" && (sortConfig.direction === "asc" ? <FaChevronUp /> : <FaChevronDown />)}
                  </th>
                  <th>Total Students</th>
                  <th>With Marks</th>
                  <th className={styles.sortableHeader} onClick={() => handleSort("averagePercentage")}>
                    Avg %
                    {sortConfig.key === "averagePercentage" && (sortConfig.direction === "asc" ? <FaChevronUp /> : <FaChevronDown />)}
                  </th>
                  <th>CGPA</th>
                  <th>Exams</th>
                  <th>Pass Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {sortedClassStats.map((cls) => {
                  const colors = getGradeColor(cls.averagePercentage);
                  return (
                    <tr key={cls.className} className={styles.tableRow}>
                      <td>
                        <span className={styles.classNameCell}>{cls.className}</span>
                      </td>
                      <td>{cls.totalStudents}</td>
                      <td>{cls.studentsWithMarks}</td>
                      <td>
                        <span className={styles.percentageCell} style={{ color: colors.color }}>
                          {cls.averagePercentage}%
                        </span>
                      </td>
                      <td>
                        <span className={styles.cgpaCell}>{cls.averageCgpa}</span>
                      </td>
                      <td>{cls.totalExams}</td>
                      <td>
                        <div className={styles.passRateCell}>
                          <div className={styles.miniProgressBar}>
                            <div 
                              className={styles.miniProgressFill}
                              style={{ 
                                width: `${cls.passRate}%`,
                                background: cls.passRate >= 75 ? "#22c55e" : cls.passRate >= 50 ? "#f59e0b" : "#ef4444"
                              }}
                            ></div>
                          </div>
                          <span>{cls.passRate}%</span>
                        </div>
                      </td>
                      <td>
                        <div 
                          className={styles.performanceBadge}
                          style={{ background: colors.bg, color: colors.color }}
                        >
                          {colors.label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedClassStats.length === 0 && (
            <div className={styles.emptyState}>
              <FaUserGraduate />
              <h3>No Class Data</h3>
              <p>No marks data available for the selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Subject-wise View */}
      {viewMode === "subject" && !selectedSubject && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              <FaBook /> Subject-wise Performance
            </h2>
          </div>

          <div className={styles.subjectGrid}>
            {sortedSubjectStats.map((subject) => {
              const colors = getGradeColor(subject.averagePercentage);
              return (
                <div key={subject.subject} className={styles.subjectCard}>
                  <div className={styles.subjectHeader}>
                    <div className={styles.subjectIcon} style={{ background: colors.bg }}>
                      <FaBook style={{ color: colors.color }} />
                    </div>
                    <div className={styles.subjectInfo}>
                      <h4>{subject.subject}</h4>
                      <span>{subject.studentCount} students | {subject.totalExams} exams</span>
                    </div>
                    <div className={styles.subjectScore} style={{ background: colors.bg, color: colors.color }}>
                      {subject.averagePercentage}%
                    </div>
                  </div>
                  <div className={styles.subjectFooter}>
                    <div className={styles.subjectStat}>
                      <span>Total Marks</span>
                      <strong>{subject.totalMarks}/{subject.totalMaxMarks}</strong>
                    </div>
                    <div className={styles.subjectStat}>
                      <span>Performance</span>
                      <strong style={{ color: colors.color }}>{colors.label}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedSubjectStats.length === 0 && (
            <div className={styles.emptyState}>
              <FaBook />
              <h3>No Subject Data</h3>
              <p>No marks data available for the selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Grade Distribution View */}
      {viewMode === "grades" && (
        <div className={styles.gradesSection}>
          <div className={styles.gradesCard}>
            <div className={styles.cardHeader}>
              <h3><FaChartPie style={{ color: "#8b5cf6" }} /> Grade Distribution Analysis</h3>
              <button 
                className={styles.toggleBtn}
                onClick={() => setExpandedGrades(!expandedGrades)}
              >
                {expandedGrades ? "Collapse" : "Expand"}
              </button>
            </div>
            
            <div className={styles.gradesGrid}>
              {getGradeDistributionData().map((grade) => {
                const gradeInfo = getGradeBadge(parseInt(grade.label.split("-")[0]) + 5);
                return (
                  <div key={grade.grade} className={styles.gradeCard}>
                    <div 
                      className={styles.gradeBadge}
                      style={{ background: gradeInfo.bg, color: gradeInfo.color }}
                    >
                      {grade.grade}
                    </div>
                    <div className={styles.gradeRange}>{grade.label}</div>
                    <div className={styles.gradeCountNumber}>{grade.count}</div>
                    <div className={styles.gradePercentBar}>
                      <div 
                        className={styles.gradePercentFill}
                        style={{ width: `${grade.percentage}%`, background: grade.color }}
                      ></div>
                    </div>
                    <div className={styles.gradePercentText}>{grade.percentage}%</div>
                  </div>
                );
              })}
            </div>

            {/* Grade Legend */}
            <div className={styles.gradeLegend}>
              <h4>CBSE Grade Scale</h4>
              <div className={styles.legendGrid}>
                <div className={styles.legendItem}>
                  <span className={styles.legendGrade} style={{ background: "#22c55e", color: "#fff" }}>A1-A2</span>
                  <span>91-100% | Grade Point 10-9</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendGrade} style={{ background: "#84cc16", color: "#fff" }}>B1</span>
                  <span>71-80% | Grade Point 8</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendGrade} style={{ background: "#f59e0b", color: "#fff" }}>B2-C1</span>
                  <span>61-70% | Grade Point 7-6</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendGrade} style={{ background: "#fb923c", color: "#fff" }}>C2-D</span>
                  <span>41-60% | Grade Point 5-4</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendGrade} style={{ background: "#ef4444", color: "#fff" }}>E</span>
                  <span>Below 33% | Needs Improvement</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className={styles.summaryCard}>
            <h3><FaChartBar style={{ color: "#3b82f6" }} /> Performance Summary</h3>
            <div className={styles.summaryStats}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Exams Analyzed</span>
                <span className={styles.summaryValue}>{schoolStats?.totalExams || 0}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Students Assessed</span>
                <span className={styles.summaryValue}>{schoolStats?.studentsWithMarks || 0}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Excellent Performance (A1-A2)</span>
                <span className={styles.summaryValue} style={{ color: "#22c55e" }}>
                  {((schoolStats?.gradeDistribution["A1"] || 0) + (schoolStats?.gradeDistribution["A2"] || 0))} exams
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Needs Improvement (D-E)</span>
                <span className={styles.summaryValue} style={{ color: "#ef4444" }}>
                  {((schoolStats?.gradeDistribution["D"] || 0) + (schoolStats?.gradeDistribution["E"] || 0))} exams
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
