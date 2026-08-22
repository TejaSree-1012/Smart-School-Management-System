"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaThLarge,
  FaCalendarAlt,
  FaChartLine, 
  FaClipboardCheck, 
  FaUsers
} from "react-icons/fa";
import styles from "@/app/styles/StudentSidebar.module.css";

interface ParentData {
  name: string;
  studentName: string;
  studentClass: string;
  studentId: string;
}

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { href: "/parent/dashboard", label: "Dashboard", icon: FaThLarge },
  { href: "/parent/timetable", label: "Timetable", icon: FaCalendarAlt },
  { href: "/parent/marks", label: "Marks", icon: FaChartLine },
  { href: "/parent/attendance", label: "Attendance", icon: FaClipboardCheck },
];

export default function ParentSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [parentData, setParentData] = useState<ParentData>({ name: "Parent", studentName: "", studentClass: "", studentId: "" });

  useEffect(() => {
    fetchParentData();
  }, []);

  async function fetchParentData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setParentData({
            name: data.user.name || "Parent",
            studentName: data.user.studentName || "",
            studentClass: data.user.studentClass || "",
            studentId: data.user.studentId || ""
          });
        }
      }
    } catch (error) {
      console.error("Error fetching parent data:", error);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>
          <FaUsers />
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Smart School</span>
            <span className={styles.logoSubtitle}>Parent Portal</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>Menu</span>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                title={collapsed ? item.label : ""}
              >
                <span className={styles.navIcon}>
                  <Icon />
                </span>
                {!collapsed && <span className={styles.navText}>{item.label}</span>}
                {isActive && <span className={styles.activeIndicator}></span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>
            {getInitials(parentData.studentName || parentData.name)}
          </div>
          {!collapsed && (
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{parentData.studentName || parentData.name}</span>
              <span className={styles.adminRole}>{parentData.studentClass || "Parent"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}