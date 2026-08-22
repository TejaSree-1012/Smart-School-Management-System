"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaThLarge,
  FaCalendarAlt,
  FaClipboardCheck,
  FaChartLine,
  FaUsers,
  FaSchool
} from "react-icons/fa";
import styles from "@/app/styles/TeacherSidebar.module.css";

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: FaThLarge },
  { href: "/teacher/timetable", label: "Timetable", icon: FaCalendarAlt },
  { href: "/teacher/attendance", label: "Attendance", icon: FaClipboardCheck },
  { href: "/teacher/marks", label: "Marks", icon: FaChartLine },
  { href: "/teacher/students", label: "Students", icon: FaUsers },
];

export default function TeacherSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [teacherName, setTeacherName] = useState("Teacher");

  useEffect(() => {
    fetchTeacherData();
  }, []);

  async function fetchTeacherData() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setTeacherName(data.user.name || "Teacher");
        }
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
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
            <span className={styles.logoSubtitle}>Teacher Portal</span>
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
        <div className={styles.teacherInfo}>
          <div className={styles.teacherAvatar}>
            {getInitials(teacherName)}
          </div>
          {!collapsed && (
            <div className={styles.teacherDetails}>
              <span className={styles.teacherLabel}>Teacher</span>
              <span className={styles.teacherName}>{teacherName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
