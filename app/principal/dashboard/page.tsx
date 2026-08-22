"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/Dashboard.module.css";
import useLogout from "@/app/hooks/useLogout";
import NotificationBell from "@/app/components/admin/NotificationBell";
import DashboardCards from "@/app/admin/dashboard/components/DashboardCards";
import QuickActions from "@/app/admin/dashboard/components/QuickActions";
import Overview from "@/app/admin/dashboard/components/Overview";
import Students from "@/app/admin/dashboard/components/Students";
import Teachers from "@/app/admin/dashboard/components/Teachers";
import Parents from "@/app/admin/dashboard/components/Parents";
import Attendance from "@/app/admin/dashboard/components/Attendance";
import Marks from "@/app/admin/dashboard/components/Marks";
import Announcements from "@/app/components/admin/Announcements";
import { FaHome, FaSignOutAlt, FaCalendarAlt, FaClock } from "react-icons/fa";

export default function PrincipalDashboard() {
  const { logout, loading } = useLogout();
  type TabType = "Overview" | "Teachers" | "Students" | "Attendance" | "Marks" | "Parents" | "Announcements";
  const tabs: TabType[] = ["Overview", "Teachers", "Students", "Attendance", "Marks", "Parents", "Announcements"];
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime ? currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";

  const formattedTime = currentTime ? currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) : "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <FaHome className={styles.breadcrumbIcon} />
            <span>Principal Dashboard</span>
          </div>
          <h1 className={styles.title}>Welcome Back, Principal</h1>
          <p className={styles.subtitle}>Here's what's happening at Smart School today.</p>
        </div>

        <div className={styles.headerRight}>
          {mounted && currentTime && (
            <div className={styles.dateTimeBox}>
              <div className={styles.dateBox}>
                <FaCalendarAlt className={styles.dateIcon} />
                <span>{formattedDate}</span>
              </div>
              <div className={styles.timeBox}>
                <FaClock className={styles.timeIcon} />
                <span>{formattedTime}</span>
              </div>
            </div>
          )}

          <div className={styles.notificationWrapper}>
            <NotificationBell />
          </div>

          <button 
            className={styles.logoutBtn} 
            onClick={logout}
            disabled={loading}
          >
            <FaSignOutAlt />
            <span>{loading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </header>

      <div className={styles.tabsContainer}>
        {tabs.map((tab: TabType, index: number) => (
          <button
            key={index}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? `${styles.tabBtn} ${styles.activeTab}`
                : styles.tabBtn
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "Overview" && (
          <>
            <DashboardCards />
            <QuickActions role="principal" />
            <Overview />
          </>
        )}

        {activeTab === "Students" && (
          <div className={styles.sectionFade}>
            <Students />
          </div>
        )}

        {activeTab === "Attendance" && (
          <div className={styles.sectionFade}>
            <Attendance />
          </div>
        )}

        {activeTab === "Marks" && (
          <div className={styles.sectionFade}>
            <Marks />
          </div>
        )}

        {activeTab === "Teachers" && (
          <div className={styles.sectionFade}>
            <Teachers />
          </div>
        )}

        {activeTab === "Parents" && (
          <div className={styles.sectionFade}>
            <Parents />
          </div>
        )}

        {activeTab === "Announcements" && (
          <div className={styles.sectionFade}>
            <Announcements />
          </div>
        )}
      </div>
    </div>
  );
}