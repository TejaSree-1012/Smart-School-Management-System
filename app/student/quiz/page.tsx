"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaQuestionCircle, FaCheckCircle, FaExclamationCircle, FaTimes, FaClipboardList } from "react-icons/fa";

type Question = {
  questionText: string;
  options: string[];
};

type QuizListItem = {
  _id: string;
  topic: string;
  className: string;
  academicYear: string;
  totalQuestions: number;
  createdAt: string;
  attempted: boolean;
  score: number | null;
  questions?: Question[];
};

export default function StudentQuizPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Taking-quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizListItem | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; correctAnswers: number[] } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/quiz", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      } else {
        showMessage("Failed to load quizzes", "error");
      }
    } catch (error) {
      console.error("Error fetching quizzes", error);
      showMessage("Failed to load quizzes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const startQuiz = (quiz: QuizListItem) => {
    if (quiz.attempted) return;
    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.totalQuestions).fill(-1));
    setResult(null);
  };

  const selectAnswer = (qIdx: number, optIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    if (answers.some(a => a === -1)) {
      showMessage("Please answer all questions before submitting", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/student/quiz-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId: activeQuiz._id, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        showMessage("Quiz submitted!", "success");
        fetchQuizzes();
      } else {
        showMessage(data.message || "Failed to submit quiz", "error");
      }
    } catch (error) {
      console.error("Error submitting quiz", error);
      showMessage("Failed to submit quiz", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeQuizView = () => {
    setActiveQuiz(null);
    setAnswers([]);
    setResult(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
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
        <p style={{ color: "#64748b", marginTop: 4 }}>Quizzes published by your teachers for your class.</p>
      </div>

      {/* Quiz Taking View */}
      {activeQuiz && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{activeQuiz.topic}</h2>
              <p style={{ fontSize: 13, color: "#64748b" }}>{activeQuiz.className} • {activeQuiz.totalQuestions} questions</p>
            </div>
            <button onClick={closeQuizView} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18 }}>
              <FaTimes />
            </button>
          </div>

          {result ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 90, height: 90, borderRadius: "50%",
                background: result.score / result.total >= 0.5 ? "#dcfce7" : "#fee2e2",
                color: result.score / result.total >= 0.5 ? "#166534" : "#991b1b",
                fontSize: 24, fontWeight: 800, marginBottom: 16
              }}>
                {result.score}/{result.total}
              </div>
              <p style={{ fontSize: 15, color: "#1e293b", fontWeight: 600, marginBottom: 20 }}>
                You scored {result.score} out of {result.total}
              </p>

              {activeQuiz.questions?.map((q, idx) => (
                <div key={idx} style={{ textAlign: "left", background: "#f8fafc", borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>{idx + 1}. {q.questionText}</p>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === result.correctAnswers[idx];
                    const isSelected = answers[idx] === oIdx;
                    return (
                      <p key={oIdx} style={{
                        fontSize: 13, padding: "6px 10px", borderRadius: 6, marginBottom: 4,
                        background: isCorrect ? "#dcfce7" : isSelected ? "#fee2e2" : "transparent",
                        color: isCorrect ? "#166534" : isSelected ? "#991b1b" : "#475569",
                        fontWeight: isCorrect || isSelected ? 600 : 400
                      }}>
                        {String.fromCharCode(65 + oIdx)}. {opt}
                        {isCorrect && " ✓"}
                        {isSelected && !isCorrect && " (your answer)"}
                      </p>
                    );
                  })}
                </div>
              ))}

              <button onClick={closeQuizView} style={{ marginTop: 12, padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {activeQuiz.questions?.map((q, idx) => (
                <div key={idx} style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>{idx + 1}. {q.questionText}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                          border: answers[idx] === oIdx ? "2px solid #1e3a5f" : "1px solid #e2e8f0",
                          background: answers[idx] === oIdx ? "#eff6ff" : "#fff"
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          checked={answers[idx] === oIdx}
                          onChange={() => selectAnswer(idx, oIdx)}
                        />
                        <span style={{ fontSize: 14, color: "#1e293b" }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "#22c55e", color: "#fff", fontWeight: 600, fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Quiz List */}
      {!activeQuiz && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          {loading ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
          ) : quizzes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <FaClipboardList style={{ fontSize: 32, color: "#cbd5e1", marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>No Quizzes Yet</h3>
              <p style={{ fontSize: 14, color: "#64748b" }}>Your teacher hasn't published any quizzes for your class yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {quizzes.map((q) => (
                <div
                  key={q._id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: 16, borderRadius: 10, border: "1px solid #e2e8f0",
                    background: q.attempted ? "#f8fafc" : "#fff"
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{q.topic}</p>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{q.totalQuestions} questions</p>
                  </div>
                  {q.attempted ? (
                    <span style={{
                      padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: "#dcfce7", color: "#166534"
                    }}>
                      Completed: {q.score}/{q.totalQuestions}
                    </span>
                  ) : (
                    <button
                      onClick={() => startQuiz(q)}
                      style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: "#1e3a5f", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                      }}
                    >
                      Take Quiz
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}