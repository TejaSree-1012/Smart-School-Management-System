"use client"

import { useState, useEffect } from "react"
import styles from "@/app/styles/Teachers.module.css"
import { FaLayerGroup, FaUserEdit, FaCheck, FaTimes, FaSearch, FaExclamationTriangle, FaSave, FaTrash, FaPlus, FaMinus, FaChalkboardTeacher, FaBook, FaUsers } from "react-icons/fa"

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
]

const SUBJECTS = {
  "Nursery": ["English", "Math", "Rhymes", "Drawing", "General Awareness"],
  "LKG": ["English", "Math", "Rhymes", "Drawing", "General Awareness"],
  "UKG": ["English", "Hindi", "Math", "EVS", "Drawing"],
  "Class 1": ["English", "Hindi", "Math", "EVS", "GK", "Drawing"],
  "Class 2": ["English", "Hindi", "Math", "EVS", "GK", "Drawing"],
  "Class 3": ["English", "Hindi", "Math", "EVS", "GK", "Drawing", "Computer"],
  "Class 4": ["English", "Hindi", "Math", "EVS", "GK", "Drawing", "Computer", "Sanskrit"],
  "Class 5": ["English", "Hindi", "Math", "EVS", "GK", "Drawing", "Computer", "Sanskrit"],
  "Class 6": ["English", "Hindi", "Math", "Science", "Social Science", "Sanskrit", "Computer", "Art"],
  "Class 7": ["English", "Hindi", "Math", "Science", "Social Science", "Sanskrit", "Computer", "Art"],
  "Class 8": ["English", "Hindi", "Math", "Science", "Social Science", "Sanskrit", "Computer", "Art"],
  "Class 9": ["English", "Hindi", "Math", "Science", "Social Science", "Sanskrit", "Computer"],
  "Class 10": ["English", "Hindi", "Math", "Science", "Social Science", "Sanskrit", "Computer"]
}

const ALL_SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer", "Sanskrit", "Art", "Music", "Physical Education", "EVS", "GK", "Math", "Rhymes", "Drawing", "General Awareness"]

interface ClassAssignment {
  className: string;
  subject: string;
}

interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  assignedClasses: ClassAssignment[];
}

export default function TeacherAssignment() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [editAssignments, setEditAssignments] = useState<ClassAssignment[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ show: boolean; text: string; type: "success" | "error" }>({ show: false, text: "", type: "success" })

  const [bulkMode, setBulkMode] = useState(false)
  const [bulkClasses, setBulkClasses] = useState<string[]>([])
  const [bulkSubjects, setBulkSubjects] = useState<string[]>([])

  useEffect(() => {
    fetchTeachers()
  }, [])

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage({ show: true, text, type })
    setTimeout(() => setMessage({ show: false, text: "", type: "success" }), 5000)
  }

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/teachers")
      const data = await res.json()
      setTeachers(data)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = teachers.filter((t: Teacher) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (t.name || "").toLowerCase().includes(searchLower) ||
      (t.email || "").toLowerCase().includes(searchLower) ||
      (t.teacherId || "").toLowerCase().includes(searchLower) ||
      (t.department || "").toLowerCase().includes(searchLower)
    )
  })

  function getAvailableSubjects(className: string): string[] {
    return SUBJECTS[className as keyof typeof SUBJECTS] || ALL_SUBJECTS
  }

  function handleSelectTeacher(teacher: Teacher) {
    setSelectedTeacher(teacher)
    setEditAssignments(teacher.assignedClasses ? [...teacher.assignedClasses] : [])
    setBulkMode(false)
    setBulkClasses([])
    setBulkSubjects([])
  }

  function addAssignment() {
    setEditAssignments([...editAssignments, { className: "", subject: "" }])
  }

  function removeAssignment(index: number) {
    setEditAssignments(editAssignments.filter((_, i) => i !== index))
  }

  function updateAssignment(index: number, field: 'className' | 'subject', value: string) {
    const updated = [...editAssignments]
    updated[index][field] = value
    setEditAssignments(updated)
  }

  function handleBulkAssign() {
    if (bulkClasses.length === 0 || bulkSubjects.length === 0) {
      showMessage("Please select at least one class and one subject", "error")
      return
    }

    const newAssignments: ClassAssignment[] = []
    bulkClasses.forEach(cls => {
      bulkSubjects.forEach(subj => {
        if (!editAssignments.some(a => a.className === cls && a.subject === subj)) {
          newAssignments.push({ className: cls, subject: subj })
        }
      })
    })

    setEditAssignments([...editAssignments, ...newAssignments])
    setBulkMode(false)
    setBulkClasses([])
    setBulkSubjects([])
    showMessage(`Added ${newAssignments.length} class-subject combinations`, "success")
  }

  function selectAllClasses() {
    if (bulkClasses.length === CLASSES.length) {
      setBulkClasses([])
    } else {
      setBulkClasses([...CLASSES])
    }
  }

  async function handleSaveAssignments() {
    if (!selectedTeacher) return

    const validAssignments = editAssignments.filter(a => a.className && a.subject)
    
    if (validAssignments.length === 0) {
      showMessage("Please add at least one valid class-subject assignment", "error")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/teachers/${selectedTeacher._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedClasses: validAssignments })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to update assignments")

      setTeachers(prev => prev.map(t => String(t._id) === String(selectedTeacher._id) ? { ...t, assignedClasses: validAssignments } : t))
      setSelectedTeacher({ ...selectedTeacher, assignedClasses: validAssignments })
      showMessage(`Assignments updated for ${selectedTeacher.name}`, "success")
    } catch (error: any) {
      showMessage(error.message || "Error saving assignments", "error")
    }
    setSaving(false)
  }

  function clearAllAssignments() {
    setEditAssignments([])
  }

  function removeDuplicates() {
    const seen = new Set<string>()
    const unique = editAssignments.filter(a => {
      const key = `${a.className}-${a.subject}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const removed = editAssignments.length - unique.length
    setEditAssignments(unique)
    if (removed > 0) {
      showMessage(`Removed ${removed} duplicate(s)`, "success")
    }
  }

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      "Mathematics": "#3b82f6",
      "Science": "#10b981",
      "English": "#8b5cf6",
      "Hindi": "#f59e0b",
      "Social Science": "#06b6d4",
      "Computer": "#6366f1",
      "Sanskrit": "#ec4899"
    }
    return colors[subject] || "#64748b"
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const totalAssignments = teachers.reduce((sum, t) => sum + (t.assignedClasses?.length || 0), 0)
  const teachersWithAssignments = teachers.filter(t => t.assignedClasses && t.assignedClasses.length > 0).length

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>
          <FaLayerGroup style={{ marginRight: 12, color: "#3b82f6" }} />
          Teacher Class & Subject Assignment
        </h1>
      </div>

      {message.show && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === "success" ? <FaCheck /> : <FaExclamationTriangle />}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage({ show: false, text: "", type: "success" })}>
            <FaTimes />
          </button>
        </div>
      )}

      <div className={styles.statsRow} style={{ marginBottom: "20px" }}>
        <div className={styles.statCard} style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05))" }}>
          <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            <FaChalkboardTeacher />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Teachers</p>
            <p className={styles.statValue}>{teachers.length}</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))" }}>
          <div className={styles.statIcon} style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
            <FaUsers />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Assigned</p>
            <p className={styles.statValue}>{teachersWithAssignments}</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))" }}>
          <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            <FaBook />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Assignments</p>
            <p className={styles.statValue}>{totalAssignments}</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))" }}>
          <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
            <FaLayerGroup />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Unassigned</p>
            <p className={styles.statValue}>{teachers.length - teachersWithAssignments}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              <FaChalkboardTeacher /> Select Teacher
            </span>
          </div>

          <div style={{ padding: "16px" }}>
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>Loading teachers...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className={styles.emptyState}>
                <FaChalkboardTeacher className={styles.emptyIcon} />
                <p>No teachers found</p>
              </div>
            ) : (
              <div>
                {filteredTeachers.map((teacher: Teacher) => (
                  <div
                    key={teacher._id}
                    onClick={() => handleSelectTeacher(teacher)}
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #e2e8f0",
                      cursor: "pointer",
                      background: selectedTeacher?._id === teacher._id ? "#f1f5f9" : "white",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className={styles.teacherAvatar}>
                        {getInitials(teacher.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{teacher.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {teacher.department || "No Department"} | {teacher.designation || "Teacher"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                          {teacher.assignedClasses?.length || 0} assignments
                        </div>
                      </div>
                    </div>
                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                        {teacher.assignedClasses.slice(0, 3).map((a, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: `${getSubjectColor(a.subject)}20`,
                              color: getSubjectColor(a.subject)
                            }}
                          >
                            {a.className} - {a.subject}
                          </span>
                        ))}
                        {teacher.assignedClasses.length > 3 && (
                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                            +{teacher.assignedClasses.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>
              <FaLayerGroup /> Manage Assignments
            </span>
          </div>

          {!selectedTeacher ? (
            <div className={styles.emptyState}>
              <FaLayerGroup className={styles.emptyIcon} />
              <p>Select a teacher to manage their class & subject assignments</p>
            </div>
          ) : (
            <div style={{ padding: "20px" }}>
              <div style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
                borderRadius: "12px",
                padding: "16px",
                color: "white",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "18px"
                  }}>
                    {getInitials(selectedTeacher.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "16px" }}>{selectedTeacher.name}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>{selectedTeacher.email}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "12px" }}>
                  <input
                    type="checkbox"
                    checked={bulkMode}
                    onChange={(e) => setBulkMode(e.target.checked)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>Bulk Assignment Mode</span>
                </label>

                {bulkMode && (
                  <div style={{
                    background: "#f8fafc",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                        Select Classes ({bulkClasses.length})
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={bulkClasses.length === CLASSES.length}
                            onChange={selectAllClasses}
                          />
                          <span>All</span>
                        </label>
                        {CLASSES.map(cls => (
                          <label key={cls} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={bulkClasses.includes(cls)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkClasses([...bulkClasses, cls])
                                } else {
                                  setBulkClasses(bulkClasses.filter(c => c !== cls))
                                }
                              }}
                            />
                            <span>{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>
                        Select Subjects ({bulkSubjects.length})
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                        {ALL_SUBJECTS.slice(0, 12).map(subj => (
                          <label key={subj} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={bulkSubjects.includes(subj)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSubjects([...bulkSubjects, subj])
                                } else {
                                  setBulkSubjects(bulkSubjects.filter(s => s !== subj))
                                }
                              }}
                            />
                            <span>{subj}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleBulkAssign}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <FaPlus style={{ marginRight: "8px" }} />
                      Add {bulkClasses.length * bulkSubjects.length} Combinations
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                  Current Assignments ({editAssignments.length})
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={removeDuplicates}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    Remove Duplicates
                  </button>
                  <button
                    onClick={clearAllAssignments}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      border: "1px solid #ef4444",
                      borderRadius: "6px",
                      color: "#ef4444",
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {editAssignments.length === 0 ? (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "2px dashed #e2e8f0"
                }}>
                  <FaLayerGroup style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }} />
                  <p>No assignments yet. Add classes and subjects.</p>
                </div>
              ) : (
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {editAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: "8px",
                        marginBottom: "8px",
                        padding: "8px",
                        background: "#f8fafc",
                        borderRadius: "8px"
                      }}
                    >
                      <select
                        value={assignment.className}
                        onChange={(e) => updateAssignment(index, 'className', e.target.value)}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontSize: "13px"
                        }}
                      >
                        <option value="">Select Class</option>
                        {CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>

                      <select
                        value={assignment.subject}
                        onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontSize: "13px"
                        }}
                      >
                        <option value="">Select Subject</option>
                        {(assignment.className ? getAvailableSubjects(assignment.className) : ALL_SUBJECTS).map(subj => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeAssignment(index)}
                        style={{
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: "6px",
                          background: "#fee2e2",
                          color: "#ef4444",
                          cursor: "pointer"
                        }}
                      >
                        <FaMinus />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  onClick={addAssignment}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "2px dashed #3b82f6",
                    borderRadius: "8px",
                    background: "white",
                    color: "#3b82f6",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <FaPlus style={{ marginRight: "8px" }} />
                  Add Individual
                </button>
              </div>

              <button
                onClick={handleSaveAssignments}
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px",
                  background: saving ? "#94a3b8" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <FaSave />
                {saving ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
