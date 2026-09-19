"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { 
  FaThLarge,
  FaCalendarAlt,
  FaChartLine, 
  FaClipboardCheck, 
  FaSchool,
  FaQuestionCircle
} from "react-icons/fa";
import styles from "@/app/styles/StudentSidebar.module.css";

interface StudentData {
  name: string;
  class: string;
  studentId: string;
}

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: FaThLarge },
  { href: "/student/timetable", label: "Timetable", icon: FaCalendarAlt },
  { href: "/student/marks", label: "Marks", icon: FaChartLine },
  { href: "/student/attendance", label: "Attendance", icon: FaClipboardCheck },
  { href: "/student/quiz", label: "Quiz", icon: FaQuestionCircle },
  

];

export default function StudentSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [student, setStudent] = useState<StudentData>({ name: "Student", class: "Class", studentId: "" });

  useEffect(() => {
    fetchStudentData();
  }, []);

  async function fetchStudentData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setStudent({
            name: data.user.name || "Student",
            class: data.user.class || "Class",
            studentId: data.user.studentId || ""
          });
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
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
          <FaSchool />
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Smart School</span>
            <span className={styles.logoSubtitle}>Student Portal</span>
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
            {getInitials(student.name)}
          </div>
          {!collapsed && (
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{student.name}</span>
              <span className={styles.adminRole}>{student.class}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
