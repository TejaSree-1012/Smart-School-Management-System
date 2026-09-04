import styles from "@/app/styles/TimetableSkeleton.module.css";

interface TimetableSkeletonProps {
  cardCount?: number;
}

export default function TimetableSkeleton({ cardCount = 8 }: TimetableSkeletonProps) {
  return (
    <div className={styles.timetableSkeletonWrapper} aria-label="Loading timetable...">
      <div className={styles.timetableSkeletonHeader}>
        <div className={styles.timetableSkeletonInfo}>
          <div className={`${styles.skeletonIcon} ${styles.shimmer}`} />
          <div className={styles.skeletonMeta}>
            <div className={`${styles.skeletonTitle} ${styles.shimmer}`} />
            <div className={`${styles.skeletonSubtitle} ${styles.shimmer}`} />
          </div>
        </div>
        <div className={styles.skeletonStats}>
          <div className={`${styles.skeletonStatCard} ${styles.shimmer}`} />
          <div className={`${styles.skeletonStatCard} ${styles.shimmer}`} />
        </div>
      </div>

      <div className={styles.skeletonPeriodsContainer}>
        <div className={styles.skeletonPeriodsGrid}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} className={styles.skeletonPeriodCard}>
              <div className={styles.skeletonTimeBox}>
                <div className={`${styles.skeletonPeriodNum} ${styles.shimmer}`} />
                <div className={`${styles.skeletonPeriodTime} ${styles.shimmer}`} />
              </div>
              <div className={styles.skeletonContentBox}>
                <div className={`${styles.skeletonSubject} ${styles.shimmer}`} />
                <div className={styles.skeletonDetailsRow}>
                  <div className={`${styles.skeletonDetail} ${styles.shimmer}`} />
                  <div className={`${styles.skeletonDetailShort} ${styles.shimmer}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
