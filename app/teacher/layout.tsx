"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TeacherSidebar from "@/app/components/teacher/TeacherSidebar";
import { FaBars, FaChevronLeft } from "react-icons/fa";
import styles from "@/app/styles/TeacherLayout.module.css";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedCollapsed = localStorage.getItem("teacherSidebarCollapsed");
    if (savedCollapsed === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("teacherSidebarCollapsed", String(newCollapsed));
  };

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <TeacherSidebar collapsed={collapsed} />
      
      <button 
        className={`${styles.toggleBtn} ${collapsed ? styles.collapsed : ""}`}
        onClick={toggleSidebar}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <FaChevronLeft />
      </button>

      <main className={`${styles.mainContent} ${collapsed ? styles.expanded : ""}`}>
        {children}
      </main>
    </div>
  );
}
