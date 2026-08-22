"use client"

import { useRouter } from "next/navigation"
import { FaUserPlus, FaChalkboardTeacher, FaClipboardList, FaUserTie } from "react-icons/fa"
import styles from "@/app/styles/QuickActions.module.css"

type QuickActionsProps = {
  role?: "admin" | "principal"
}

export default function QuickActions({ role = "admin" }: QuickActionsProps) {
  const router = useRouter()
  const basePath = role === "principal" ? "/principal" : "/admin"

  let actions = [
    {
      title: "Add Teacher",
      description: "Hire new teacher",
      icon: <FaChalkboardTeacher />,
      color: "green",
      link: `${basePath}/teachers`
    },
    {
      title: "Add Parent",
      description: "Register parent account",
      icon: <FaUserPlus />,
      color: "purple",
      link: `${basePath}/parents`
    },
    {
      title: "Admission",
      description: "View admission requests",
      icon: <FaClipboardList />,
      color: "orange",
      link: `${basePath}/admissions`
    }
  ]

  if (role === "admin") {
    actions = [
      ...actions,
      {
        title: "Principal",
        description: "Manage principal",
        icon: <FaUserTie />,
        color: "red",
        link: `${basePath}/principal`
      }
    ]
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quick Actions</h2>
        <p className={styles.subtitle}>Common administrative tasks</p>
      </div>

      <div className={styles.actionsGrid}>
        {actions.map((action, index) => (
          <button
            key={index}
            className={`${styles.actionCard} ${styles[action.color]}`}
            onClick={() => router.push(action.link)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={styles.iconWrapper}>
              {action.icon}
            </div>
            <div className={styles.content}>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
            <div className={styles.arrow}>
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
