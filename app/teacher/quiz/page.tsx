"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaQuestionCircle, FaMagic, FaCheckCircle, FaExclamationCircle, FaTimes, FaTrash, FaEdit, FaSave } from "react-icons/fa";

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

type Question = {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
};

type Quiz = {
  _id: string;
  className: string;
  academicYear: string;
  topic: string;
  questions: Question[];
  status: "draft" | "published";
  attemptCount?: number;
  createdAt: string;
};

export default function TeacherQuizPage() {
  const [className, setClassName] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [generating, setGenerating] = useState(false);

  const [draftQuiz, setDraftQuiz] = useState<Quiz | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/teachers/quiz", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Error fetching quizzes", error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleGenerate = async () => {
    if (!className || !academicYear || !topic.trim()) {
      showMessage("Class, academic year and topic are required", "error");
      return;
    }
    try {
      setGenerating(true);
      setDraftQuiz(null);
      const res = await fetch("/api/teachers/quiz-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          className,
          academicYear,
          topic: topic.trim(),
          notes: notes.trim(),
          numQuestions: Number(numQuestions) || 5,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraftQuiz(data);
        showMessage("Quiz generated! Review it below before publishing.", "success");
      } else {
        showMessage(data.message || "Failed to generate quiz", "error");
      }
    } catch (error) {
      console.error("Error generating quiz", error);
      showMessage("Failed to generate quiz", "error");
    } finally {
      setGenerating(false);
    }
  };

  const updateDraftQuestion = (idx: number, updated: Question) => {
    if (!draftQuiz) return;
    const newQuestions = [...draftQuiz.questions];
    newQuestions[idx] = updated;
    setDraftQuiz({ ...draftQuiz, questions: newQuestions });
  };

  const removeDraftQuestion = (idx: number) => {
    if (!draftQuiz) return;
    const newQuestions = draftQuiz.questions.filter((_, i) => i !== idx);
    setDraftQuiz({ ...draftQuiz, questions: newQuestions });
  };

  const handlePublish = async () => {
    if (!draftQuiz) return;
    if (draftQuiz.questions.length === 0) {
      showMessage("Cannot publish a quiz with no questions", "error");
      return;
    }
    try {
      const res = await fetch("/api/teachers/quiz", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId: draftQuiz._id,
          questions: draftQuiz.questions,
          status: "published",
        }),
      });
      if (res.ok) {
        showMessage("Quiz published! Students can now take it.", "success");
        setDraftQuiz(null);
        fetchQuizzes();
      } else {
        const data = await res.json();
        showMessage(data.message || "Failed to publish quiz", "error");
      }
    } catch (error) {
      console.error("Error publishing quiz", error);
      showMessage("Failed to publish quiz", "error");
    }
  };

  const handleSaveDraftEdits = async () => {
    if (!draftQuiz) return;
    try {
      const res = await fetch("/api/teachers/quiz", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId: draftQuiz._id, questions: draftQuiz.questions }),
      });
      if (res.ok) {
        showMessage("Draft saved", "success");
      } else {
        showMessage("Failed to save draft", "error");
      }
    } catch (error) {
      console.error("Error saving draft", error);
      showMessage("Failed to save draft", "error");
    }
  };

  const handleDiscardDraft = async () => {
    if (!draftQuiz) return;
    try {
      await fetch(`/api/teachers/quiz?quizId=${draftQuiz._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDraftQuiz(null);
      fetchQuizzes();
      showMessage("Draft discarded", "success");
    } catch (error) {
      console.error("Error discarding draft", error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/teachers/quiz?quizId=${quizId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showMessage("Quiz deleted", "success");
        fetchQuizzes();
      } else {
        const data = await res.json();
        showMessage(data.message || "Failed to delete quiz", "error");
      }
    } catch (error) {
      console.error("Error deleting quiz", error);
    }
  };

  const fetchResults = async (quiz: Quiz) => {
    try {
      setResultsQuiz(quiz);
      setLoadingResults(true);
      setResultsData(null);
      const res = await fetch(`/api/teachers/quiz-results?quizId=${quiz._id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setResultsData(data);
      } else {
        showMessage("Failed to load results", "error");
      }
    } catch (error) {
      console.error("Error fetching results", error);
      showMessage("Failed to load results", "error");
    } finally {
      setLoadingResults(false);
    }
  };

  const closeResults = () => {
    setResultsQuiz(null);
    setResultsData(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 20, right: 20, zIndex: 100,
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 18px", borderRadius: 10,
              background: message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#166534" : "#991b1b",
              fontSize: 14, fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><FaTimes /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
          <FaQuestionCircle /> Quiz
        </h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>Auto-generate a quiz with AI, review it, then publish it for students.</p>
      </div>

      {/* Generate Form */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Generate a New Quiz</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Class</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            >
              <option value="">Select a class...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Number of Questions</label>
            <input
              type="number"
              min={3}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Fractions, Indian Freedom Struggle"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste chapter text or notes to base the questions on..."
            rows={4}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical" }}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: "#1e3a5f", color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1
          }}
        >
          <FaMagic /> {generating ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {/* Draft Review */}
      {draftQuiz && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Review Draft: {draftQuiz.topic}</h2>
              <p style={{ fontSize: 13, color: "#92400e" }}>{draftQuiz.className} • {draftQuiz.academicYear} • {draftQuiz.questions.length} questions — review before publishing</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSaveDraftEdits} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <FaSave /> Save Draft
              </button>
              <button onClick={handlePublish} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Publish Quiz
              </button>
              <button onClick={handleDiscardDraft} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff", color: "#991b1b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Discard
              </button>
            </div>
          </div>

          {draftQuiz.questions.map((q, idx) => (
            <div key={idx} style={{ background: "#fff", borderRadius: 8, padding: 14, marginBottom: 10, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                {editingIdx === idx ? (
                  <div style={{ flex: 1 }}>
                    <input
                      value={q.questionText}
                      onChange={(e) => updateDraftQuestion(idx, { ...q, questionText: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}
                    />
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          checked={q.correctOptionIndex === oIdx}
                          onChange={() => updateDraftQuestion(idx, { ...q, correctOptionIndex: oIdx })}
                        />
                        <input
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[oIdx] = e.target.value;
                            updateDraftQuestion(idx, { ...q, options: newOptions });
                          }}
                          style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13 }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>{idx + 1}. {q.questionText}</p>
                    {q.options.map((opt, oIdx) => (
                      <p key={oIdx} style={{
                        fontSize: 13, padding: "4px 8px", borderRadius: 6, marginBottom: 4,
                        background: oIdx === q.correctOptionIndex ? "#dcfce7" : "transparent",
                        color: oIdx === q.correctOptionIndex ? "#166534" : "#475569",
                        fontWeight: oIdx === q.correctOptionIndex ? 600 : 400
                      }}>
                        {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctOptionIndex && "✓"}
                      </p>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }} title="Edit">
                    <FaEdit />
                  </button>
                  <button onClick={() => removeDraftQuestion(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }} title="Remove">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Results Panel */}
      {resultsQuiz && (
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Results: {resultsQuiz.topic}</h2>
              <p style={{ fontSize: 13, color: "#1e3a5f" }}>{resultsQuiz.className} ({resultsQuiz.academicYear})</p>
            </div>
            <button onClick={closeResults} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 16 }}>
              <FaTimes />
            </button>
          </div>

          {loadingResults ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading results...</p>
          ) : resultsData ? (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>
                {resultsData.attemptedCount} of {resultsData.totalStudents} students attempted
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: "#fff", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Student</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsData.results.map((r: any) => (
                      <tr key={r.studentId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{r.studentName}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{r.studentIdNumber}</div>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                            background: r.attempted ? "#dcfce7" : "#fee2e2",
                            color: r.attempted ? "#166534" : "#991b1b"
                          }}>
                            {r.attempted ? "Attempted" : "Not Attempted"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>
                          {r.attempted ? `${r.score}/${resultsData.totalQuestions}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ color: "#64748b", fontSize: 14 }}>No data available.</p>
          )}
        </div>
      )}

      {/* My Quizzes */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>My Quizzes</h2>
        {loadingList ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
        ) : quizzes.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>No quizzes yet. Generate one above to get started.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Topic</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Class</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Questions</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Attempts</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>{q.topic}</td>
                    <td style={{ padding: "12px", color: "#475569" }}>{q.className} ({q.academicYear})</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{q.questions.length}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                        background: q.status === "published" ? "#dcfce7" : "#f1f5f9",
                        color: q.status === "published" ? "#166534" : "#475569"
                      }}>
                        {q.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{q.attemptCount || 0}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        {q.status === "draft" && (
                          <button onClick={() => setDraftQuiz(q)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                            Review
                          </button>
                        )}
                        {q.status === "draft" && (
                          <button onClick={() => handleDeleteQuiz(q._id)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff", color: "#991b1b", cursor: "pointer" }}>
                            Delete
                          </button>
                        )}
                        {q.status === "published" && (
                          <button onClick={() => fetchResults(q)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                            Results
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}