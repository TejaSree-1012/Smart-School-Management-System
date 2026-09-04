"use client"

import styles from "@/app/styles/AdminSidebar.module.css";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FaThLarge, 
  FaUserTie, 
  FaClipboardList,
  
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSchool,
  FaClock,
  FaCalendarCheck,
  FaCalendarAlt,
  FaBook,
  FaLayerGroup,
  FaMoneyBillWave
} from "react-icons/fa";

type SidebarProps = {
  collapsed: boolean
  role?: "admin" | "principal"
}

export default function Sidebar({ collapsed, role = "admin" }: SidebarProps) {
  const pathname = usePathname()
  const basePath = role === "principal" ? "/principal" : "/admin"
  
  const navItems = [
    { href: `${basePath}/dashboard`, label: "Dashboard", icon: FaThLarge },
    { href: `${basePath}/admissions`, label: "Admissions", icon: FaClipboardList },
    { href: `${basePath}/teacher-assignment`, label: "Teacher Assignment", icon: FaLayerGroup },
    { href: `${basePath}/attendance`, label: "Attendance", icon: FaCalendarCheck },
    { href: `${basePath}/marks`, label: "Marks", icon: FaBook },
    { href: `${basePath}/timetable`, label: "Timetable", icon: FaClock },
    { href: `${basePath}/fees`, label: "Fees", icon: FaMoneyBillWave },
  ]
  
  const portalTitle = role === "principal" ? "Principal Portal" : "Admin Portal"
  const userName = role === "principal" ? "Principal" : "Administrator"
  const userRole = role === "principal" ? "Principal" : "Super Admin"
  const avatarLetter = role === "principal" ? "P" : "A"

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>
          <FaSchool />
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Smart School</span>
            <span className={styles.logoSubtitle}>{portalTitle}</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>Main Menu</span>}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
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
            )
          })}
        </div>

        
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>
            <span>{avatarLetter}</span>
          </div>
          {!collapsed && (
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{userName}</span>
              <span className={styles.adminRole}>{userRole}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
