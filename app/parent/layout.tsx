"use client";

import { useState, useEffect } from "react";
import ParentSidebar from "@/app/components/parent/ParentSidebar";
import styles from "@/app/styles/StudentLayout.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.layout}>
      <ParentSidebar collapsed={collapsed} />
      
      <button
        className={`${styles.toggleBtn} ${collapsed ? styles.toggleCollapsed : ""}`}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <main className={`${styles.main} ${collapsed ? styles.mainExpanded : ""}`}>
        {children}
      </main>
    </div>
  );
}