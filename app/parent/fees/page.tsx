"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoneyBillWave, FaTimes, FaCheckCircle, FaExclamationCircle, FaDownload } from "react-icons/fa";
import styles from "@/app/styles/FeeManagement.module.css"; // Reuse the same styles

export default function ParentFeeManagement() {
  const [feeStatus, setFeeStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    async function fetchFees() {
      try {
        setLoading(true);
        const res = await fetch("/api/parent/fee-status", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setFeeStatus(data);
        } else {
          const err = await res.json();
          showMessage(err.error || "Failed to fetch fee status", "error");
        }
      } catch (error) {
        console.error("Error fetching fees:", error);
        showMessage("Failed to fetch fee status", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchFees();
  }, []);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
          <h1>Fee Status</h1>
          <p>View your fee summary and payment history</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading fee information...</div>
        </div>
      ) : feeStatus.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FaMoneyBillWave /></div>
          <h3 className={styles.emptyTitle}>No Data Found</h3>
          <p className={styles.emptyText}>No fee records were found for your linked students.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {feeStatus.map((child, index) => (
            <motion.div 
              key={child.studentId}
              className={styles.timetableWrapper}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.timetableHeader}>
                <div className={styles.timetableInfo}>
                  <div className={styles.timetableIcon}>
                    <FaMoneyBillWave />
                  </div>
                  <div className={styles.timetableMeta}>
                    <h2>{child.studentName}</h2>
                    <p>{child.className} | {child.academicYear}</p>
                  </div>
                </div>
              </div>

              <div className={styles.periodsContainer}>
                {child.status === "No Fee Set" ? (
                  <div style={{ padding: "24px", background: "#f1f5f9", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "32px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", color: "#64748b", marginBottom: "8px" }}><FaMoneyBillWave /></div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#334155", margin: "0 0 4px 0" }}>Fee Structure Not Configured</h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Fee structure not yet published for {child.className}.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Total Due</div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginTop: "8px" }}>{formatMoney(child.totalDue)}</div>
                    </div>
                    <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#166534", textTransform: "uppercase" }}>Total Paid</div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "#15803d", marginTop: "8px" }}>{formatMoney(child.totalPaid)}</div>
                    </div>
                    <div style={{ padding: "20px", background: child.balance > 0 ? "#fef2f2" : "#f8fafc", borderRadius: "12px", border: `1px solid ${child.balance > 0 ? "#fecaca" : "#e2e8f0"}` }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: child.balance > 0 ? "#991b1b" : "#64748b", textTransform: "uppercase" }}>Remaining Balance</div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: child.balance > 0 ? "#dc2626" : "#1e293b", marginTop: "8px" }}>{formatMoney(child.balance)}</div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{
                          padding: "4px 12px", 
                          borderRadius: "12px", 
                          fontSize: "12px", 
                          fontWeight: 700,
                          background: child.status === "Paid" ? "#dcfce7" : child.status === "Partial" ? "#fef9c3" : "#fee2e2",
                          color: child.status === "Paid" ? "#166534" : child.status === "Partial" ? "#854d0e" : "#991b1b"
                        }}>
                          {child.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>Payment History</h3>
                
                {child.payments && child.payments.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                          <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Date</th>
                          <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Receipt No.</th>
                          <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Fee Type</th>
                          <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Mode</th>
                          <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                          <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#64748b", textTransform: "uppercase" }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {child.payments.map((p: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                            <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>{p.receiptNumber}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600 }}>{p.feeType}</td>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{p.paymentMode}</td>
                            <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", fontWeight: 600, color: "#22c55e" }}>{formatMoney(p.amountPaid)}</td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              
                               <a href={`/api/parent/fee-payments/${p._id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#2563eb", fontWeight: 600, textDecoration: "none", fontSize: "13px" }}
                                title="Download Receipt"
                              >
                              <FaDownload /> Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState} style={{ padding: "40px 20px" }}>
                    <p className={styles.emptyText}>No payments recorded yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}