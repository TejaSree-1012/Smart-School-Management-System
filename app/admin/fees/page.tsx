"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoneyBillWave, FaSave, FaTimes, FaPlus, FaSearch, FaHistory, FaCheckCircle, FaExclamationCircle, FaDownload } from "react-icons/fa";
import styles from "@/app/styles/FeeManagement.module.css";

const CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

const FEE_TYPES = ["Tuition", "Transport", "Lab", "Exam", "Library", "Sports", "Other"];
const PAYMENT_MODES = ["Cash", "Online", "Cheque", "Card"];

export default function AdminFeeManagement() {
  const [activeTab, setActiveTab] = useState<"structure" | "payments" | "report">("structure");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Tab 1 state
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({});
  const [savingStructure, setSavingStructure] = useState(false);

  // Tab 2 state
  const [feeSummary, setFeeSummary] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  
  const [paymentForm, setPaymentForm] = useState({
    feeType: "Tuition",
    amountPaid: "",
    paymentMode: "Online",
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ""
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tab 3 state - Pending Dues Report
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoaded, setReportLoaded] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSearch, setReportSearch] = useState("");

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchFeeStructure = useCallback(async () => {
    if (!selectedClass || !academicYear) {
      setFeeAmounts({});
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/fee-structure?className=${encodeURIComponent(selectedClass)}&academicYear=${encodeURIComponent(academicYear)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        const amounts: Record<string, string> = {};
        data.forEach((item: any) => {
          amounts[item.feeType] = item.amount.toString();
        });
        setFeeAmounts(amounts);
      }
    } catch (error) {
      console.error("Error fetching fee structure", error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, academicYear]);

  const fetchFeeSummary = useCallback(async () => {
    if (!selectedClass || !academicYear) {
      setFeeSummary([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/fee-summary?className=${encodeURIComponent(selectedClass)}&academicYear=${encodeURIComponent(academicYear)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setFeeSummary(data);
      }
    } catch (error) {
      console.error("Error fetching fee summary", error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, academicYear]);

  useEffect(() => {
    if (activeTab === "structure") {
      fetchFeeStructure();
    } else {
      fetchFeeSummary();
    }
  }, [activeTab, selectedClass, academicYear, fetchFeeStructure, fetchFeeSummary]);

  const handleSaveStructure = async () => {
    if (!selectedClass || !academicYear) {
      showMessage("Please select a class and academic year", "error");
      return;
    }

    try {
      setSavingStructure(true);
      
      const promises = FEE_TYPES.map(type => {
        const amount = Number(feeAmounts[type] || 0);
        if (amount > 0) {
          return fetch('/api/admin/fee-structure', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              className: selectedClass,
              academicYear,
              feeType: type,
              amount,
              term: "Full Year"
            })
          });
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);
      showMessage("Fee structure saved successfully!", "success");
      fetchFeeStructure();
    } catch (error) {
      console.error("Error saving fee structure", error);
      showMessage("Failed to save fee structure", "error");
    } finally {
      setSavingStructure(false);
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!paymentForm.amountPaid || isNaN(Number(paymentForm.amountPaid)) || Number(paymentForm.amountPaid) <= 0) {
      showMessage("Please enter a valid amount", "error");
      return;
    }
    try {
      setSavingPayment(true);
      const res = await fetch('/api/admin/fee-payments', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: selectedStudentForPayment.studentId,
          className: selectedClass,
          academicYear,
          feeType: paymentForm.feeType,
          amountPaid: Number(paymentForm.amountPaid),
          paymentMode: paymentForm.paymentMode,
          paymentDate: paymentForm.paymentDate,
          remarks: paymentForm.remarks
        })
      });

      if (res.ok) {
        showMessage("Payment recorded successfully!", "success");
        setShowPaymentModal(false);
        fetchFeeSummary();
      } else {
        const data = await res.json();
        showMessage(data.message || "Failed to record payment", "error");
      }
    } catch (error) {
      console.error("Error recording payment", error);
      showMessage("Failed to record payment", "error");
    } finally {
      setSavingPayment(false);
    }
  };

  const openHistoryModal = async (student: any) => {
    setSelectedStudentForHistory(student);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setStudentHistory([]);
    try {
      const res = await fetch(`/api/admin/fee-payments?studentId=${student.studentId}&academicYear=${encodeURIComponent(academicYear)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setStudentHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history", error);
      showMessage("Failed to fetch history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const filteredSummary = useMemo(() => {
    return feeSummary.filter(s => 
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentIdNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeSummary, searchQuery]);

  const loadPendingDuesReport = async () => {
    if (!reportYear.trim()) {
      showMessage("Please enter an academic year", "error");
      return;
    }
    try {
      setLoadingReport(true);
      setReportLoaded(false);
      const res = await fetch(`/api/admin/fee-pending-report?academicYear=${encodeURIComponent(reportYear)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setReportLoaded(true);
      } else {
        showMessage("Failed to load pending dues report", "error");
      }
    } catch (error) {
      console.error("Error loading pending dues report", error);
      showMessage("Failed to load pending dues report", "error");
    } finally {
      setLoadingReport(false);
    }
  };

  const filteredReport = useMemo(() => {
    return reportData.filter(r => 
      r.studentName.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.className.toLowerCase().includes(reportSearch.toLowerCase())
    );
  }, [reportData, reportSearch]);

  const reportTotalBalance = useMemo(() => {
    return filteredReport.reduce((sum, r) => sum + r.balance, 0);
  }, [filteredReport]);

  const handleExportReportCSV = () => {
    const headers = ["Student Name", "Student ID", "Class", "Total Due", "Total Paid", "Balance", "Status"];
    const csvData = filteredReport.map(s => [
      s.studentName || "",
      s.studentIdNumber || "",
      s.className || "",
      s.totalDue,
      s.totalPaid,
      s.balance,
      s.status || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pending_dues_report_${reportYear}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showMessage("Pending dues report exported successfully", "success");
  };

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {message && (
          <motion.div 
            className={`${styles.toast} ${styles[message.type]}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><FaTimes /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Fee Management</h1>
          <p>Manage class fee structures and track student payments</p>
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlsLeft}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Class</label>
            <select 
              className={styles.controlSelect}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select a class...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Academic Year</label>
            <input 
              type="text"
              className={styles.controlSelect}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026"
            />
          </div>
        </div>
        <div className={styles.weekDays}>
          <button 
            className={`${styles.dayBtn} ${activeTab === "structure" ? styles.active : ""}`}
            onClick={() => setActiveTab("structure")}
          >
            Structure
          </button>
          <button 
            className={`${styles.dayBtn} ${activeTab === "payments" ? styles.active : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Payments & Dues
          </button>
          <button 
            className={`${styles.dayBtn} ${activeTab === "report" ? styles.active : ""}`}
            onClick={() => setActiveTab("report")}
          >
            Pending Dues Report
          </button>
        </div>
      </div>

      {activeTab === "structure" && (
        <motion.div 
          className={styles.timetableWrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.timetableHeader}>
            <div className={styles.timetableInfo}>
              <div className={styles.timetableIcon}>
                <FaMoneyBillWave />
              </div>
              <div className={styles.timetableMeta}>
                <h2>Fee Structure Configuration</h2>
                <p>{selectedClass ? `For ${selectedClass} (${academicYear})` : "Select a class to configure fees"}</p>
              </div>
            </div>
          </div>
          
          <div className={styles.periodsContainer}>
            {selectedClass ? (
              <div style={{ maxWidth: 600 }}>
                {FEE_TYPES.map(type => (
                  <div key={type} className={styles.periodFormRow} style={{ marginBottom: 12 }}>
                    <div className={styles.periodFormFields} style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{type} Fee</span>
                      </div>
                      <div className={styles.periodFormTime}>
                        <span style={{ fontSize: '15px', fontWeight: 600 }}>₹</span>
                        <input 
                          type="number"
                          className={styles.formInput}
                          placeholder="Amount"
                          value={feeAmounts[type] || ""}
                          onChange={(e) => setFeeAmounts({...feeAmounts, [type]: e.target.value})}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: 24 }}>
                  <button 
                    className={styles.addBtn}
                    onClick={handleSaveStructure}
                    disabled={savingStructure}
                  >
                    <FaSave /> {savingStructure ? "Saving..." : "Save Fee Structure"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaMoneyBillWave /></div>
                <h3 className={styles.emptyTitle}>No Class Selected</h3>
                <p className={styles.emptyText}>Select a class from the dropdown above to view or configure its fee structure.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "payments" && (
        <motion.div 
          className={styles.timetableWrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.timetableHeader}>
            <div className={styles.timetableInfo}>
              <div className={styles.timetableIcon}>
                <FaMoneyBillWave />
              </div>
              <div className={styles.timetableMeta}>
                <h2>Payments & Dues Overview</h2>
                <p>{selectedClass ? `${selectedClass} students (${academicYear})` : "Select a class to view dues"}</p>
              </div>
            </div>
            {selectedClass && feeSummary.length > 0 && (
              <div className={styles.headerActions}>
                <div style={{ position: "relative" }}>
                  <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input 
                    type="text" 
                    placeholder="Search student..." 
                    className={styles.formInput}
                    style={{ paddingLeft: 36, width: 250 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.periodsContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>Loading fee summary...</div>
              </div>
            ) : !selectedClass ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaMoneyBillWave /></div>
                <h3 className={styles.emptyTitle}>No Class Selected</h3>
                <p className={styles.emptyText}>Select a class from the dropdown above to view student dues.</p>
              </div>
            ) : feeSummary.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaMoneyBillWave /></div>
                <h3 className={styles.emptyTitle}>No Students Found</h3>
                <p className={styles.emptyText}>There are no active students in this class.</p>
              </div>
            ) : feeSummary.every(s => s.status === "No Fee Set") ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaMoneyBillWave /></div>
                <h3 className={styles.emptyTitle}>No Fee Structure Configured</h3>
                <p className={styles.emptyText}>No fee structure has been set for {selectedClass} yet. Go to the Fee Structure tab to set it up first.</p>
                <button 
                  className={styles.addBtn}
                  style={{ marginTop: 16 }}
                  onClick={() => setActiveTab("structure")}
                >
                  Go to Fee Structure
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Student</th>
                      <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Total Due</th>
                      <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Total Paid</th>
                      <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Balance</th>
                      <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummary.map((student) => (
                      <tr key={student.studentId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "16px 12px" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{student.studentName}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{student.studentIdNumber}</div>
                        </td>
                        <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 600 }}>{formatMoney(student.totalDue)}</td>
                        <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 600, color: "#22c55e" }}>{formatMoney(student.totalPaid)}</td>
                        <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: student.balance > 0 ? "#ef4444" : "#1e293b" }}>
                          {formatMoney(student.balance)}
                        </td>
                        <td style={{ padding: "16px 12px", textAlign: "center" }}>
                          <span style={{
                            padding: "4px 12px", 
                            borderRadius: "12px", 
                            fontSize: "12px", 
                            fontWeight: 700,
                            background: student.status === "Paid" ? "#dcfce7" : student.status === "Partial" ? "#fef9c3" : student.status === "Unpaid" ? "#fee2e2" : "#f1f5f9",
                            color: student.status === "Paid" ? "#166534" : student.status === "Partial" ? "#854d0e" : student.status === "Unpaid" ? "#991b1b" : "#475569"
                          }}>
                            {student.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 12px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button 
                              className={styles.addBtn}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => {
                                setSelectedStudentForPayment(student);
                                setPaymentForm({
                                  ...paymentForm,
                                  amountPaid: student.balance > 0 ? student.balance.toString() : "",
                                });
                                setShowPaymentModal(true);
                              }}
                            >
                              <FaPlus /> Record
                            </button>
                            <button 
                              className={styles.actionBtn}
                              title="View History"
                              onClick={() => openHistoryModal(student)}
                            >
                              <FaHistory />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "report" && (
        <motion.div 
          className={styles.timetableWrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.timetableHeader}>
            <div className={styles.timetableInfo}>
              <div className={styles.timetableIcon}>
                <FaExclamationCircle />
              </div>
              <div className={styles.timetableMeta}>
                <h2>Pending Dues Report</h2>
                <p>School-wide view of students with unpaid or partial fee balances</p>
              </div>
            </div>
            {reportLoaded && filteredReport.length > 0 && (
              <div className={styles.headerActions}>
                <button className={styles.addBtn} onClick={handleExportReportCSV}>
                  <FaDownload /> Export CSV
                </button>
              </div>
            )}
          </div>

          <div className={styles.periodsContainer}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 20 }}>
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Academic Year</label>
                <input 
                  type="text"
                  className={styles.controlSelect}
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  placeholder="e.g. 2026"
                />
              </div>
              <button 
                className={styles.addBtn}
                onClick={loadPendingDuesReport}
                disabled={loadingReport}
              >
                {loadingReport ? "Loading..." : "Load Report"}
              </button>
            </div>

            {loadingReport ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>Loading pending dues report...</div>
              </div>
            ) : !reportLoaded ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaExclamationCircle /></div>
                <h3 className={styles.emptyTitle}>No Report Loaded</h3>
                <p className={styles.emptyText}>Select an academic year and click "Load Report" to see all students with pending dues across every class.</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaCheckCircle /></div>
                <h3 className={styles.emptyTitle}>No Pending Dues</h3>
                <p className={styles.emptyText}>Every student has either paid in full or has no fee structure set for {reportYear}.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {filteredReport.length} student{filteredReport.length !== 1 ? "s" : ""} with pending dues, totaling {formatMoney(reportTotalBalance)}
                  </p>
                  <div style={{ position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input 
                      type="text" 
                      placeholder="Search student or class..." 
                      className={styles.formInput}
                      style={{ paddingLeft: 36, width: 250 }}
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Student</th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Class</th>
                        <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Total Due</th>
                        <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Total Paid</th>
                        <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Balance</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReport.map((s, idx) => (
                        <tr key={`${s.studentIdNumber}-${idx}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "16px 12px" }}>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{s.studentName}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{s.studentIdNumber}</div>
                          </td>
                          <td style={{ padding: "16px 12px" }}>{s.className}</td>
                          <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 600 }}>{formatMoney(s.totalDue)}</td>
                          <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 600, color: "#22c55e" }}>{formatMoney(s.totalPaid)}</td>
                          <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: "#ef4444" }}>{formatMoney(s.balance)}</td>
                          <td style={{ padding: "16px 12px", textAlign: "center" }}>
                            <span style={{
                              padding: "4px 12px", 
                              borderRadius: "12px", 
                              fontSize: "12px", 
                              fontWeight: 700,
                              background: s.status === "Partial" ? "#fef9c3" : "#fee2e2",
                              color: s.status === "Partial" ? "#854d0e" : "#991b1b"
                            }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Record Payment</h3>
                  <p className={styles.modalSubtitle}>For {selectedStudentForPayment?.studentName}</p>
                </div>
                <button className={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                {selectedStudentForPayment?.status === "No Fee Set" && (
                  <div style={{ padding: "12px 16px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", marginBottom: "20px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#991b1b" }}>
                      <FaExclamationCircle style={{ marginRight: 6, verticalAlign: "middle" }}/>
                      No fee structure has been set for this class yet. This payment won't be tracked against any due amount.
                    </p>
                  </div>
                )}
                <div className={styles.periodsForm}>
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>Fee Type</label>
                    <select 
                      className={styles.formInput}
                      value={paymentForm.feeType}
                      onChange={(e) => setPaymentForm({...paymentForm, feeType: e.target.value})}
                    >
                      {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>Amount Paid (₹)</label>
                    <input 
                      type="number"
                      className={styles.formInput}
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({...paymentForm, amountPaid: e.target.value})}
                      placeholder="e.g. 5000"
                      min="1"
                    />
                  </div>

                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>Payment Mode</label>
                    <select 
                      className={styles.formInput}
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm({...paymentForm, paymentMode: e.target.value})}
                    >
                      {PAYMENT_MODES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>Payment Date</label>
                    <input 
                      type="date"
                      className={styles.formInput}
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                    />
                  </div>

                  <div className={styles.controlGroup}>
                    <label className={styles.controlLabel}>Remarks (Optional)</label>
                    <input 
                      type="text"
                      className={styles.formInput}
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})}
                      placeholder="Transaction ID, Cheque number, etc."
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleRecordPaymentSubmit} disabled={savingPayment}>
                  {savingPayment ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View History Modal */}
        {showHistoryModal && (
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              style={{ maxWidth: 800 }}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Payment History</h3>
                  <p className={styles.modalSubtitle}>{selectedStudentForHistory?.studentName} ({academicYear})</p>
                </div>
                <button className={styles.modalClose} onClick={() => setShowHistoryModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                {loadingHistory ? (
                   <div className={styles.loadingContainer} style={{ minHeight: 200 }}>
                    <div className={styles.loadingSpinner}></div>
                   </div>
                ) : studentHistory.length === 0 ? (
                  <div className={styles.emptyState} style={{ padding: "40px 20px" }}>
                    <h3 className={styles.emptyTitle}>No Payments Found</h3>
                    <p className={styles.emptyText}>This student has no recorded payments for this academic year.</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Date</th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Receipt No.</th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Fee Type</th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Mode</th>
                        <th style={{ padding: "12px", textAlign: "right", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                        <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentHistory.map(record => (
                        <tr key={record._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "12px", fontSize: "14px" }}>
                            {new Date(record.paymentDate).toLocaleDateString('en-GB')}
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>
                            {record.receiptNumber}
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600 }}>
                            {record.feeType}
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px" }}>
                            {record.paymentMode}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", fontWeight: 600, color: "#22c55e" }}>
                            {formatMoney(record.amountPaid)}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            
                             <a href={`/api/admin/fee-payments/${record._id}/receipt`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionBtn}
                              style={{ display: "inline-flex", textDecoration: "none" }}
                              title="Download Receipt"
                            >
                              <FaDownload />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}