"use client"
import Sidebar from "@/app/components/admin/Sidebar"
import styles from "@/app/styles/AdminLayout.module.css"
import { useState, useEffect } from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { useRouter } from "next/navigation"

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {

const [collapsed, setCollapsed] = useState(false)
const router = useRouter()

useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) {
        router.push("/login/principal")
        return
      }
      const data = await res.json()
      if (!data.user || data.user.role !== "principal") {
        router.push("/login/principal")
      }
    } catch {
      router.push("/login/principal")
    }
  }
  checkAuth()
}, [router])

return (
  <div className={styles.layout}>
    <Sidebar collapsed={collapsed} role="principal" />

    <button
      className={`${styles.toggleBtn} ${collapsed ? styles.toggleCollapsed : ""}`}
      onClick={() => setCollapsed(!collapsed)}
      title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
    >
      {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
    </button>

    <div className={`${styles.main} ${collapsed ? styles.mainExpanded : ""}`}>
      {children}
    </div>
  </div>
)
}