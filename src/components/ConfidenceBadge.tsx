import type { Doc } from "../../convex/_generated/dataModel";
import styles from "./ConfidenceBadge.module.css";

type Confidence = Doc<"players">["confidence"];

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const isConfirmed = confidence === "confirmado";
  return (
    <span
      className={`${styles.badge} ${isConfirmed ? styles.confirmado : styles.probable}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {isConfirmed ? (
          <svg viewBox="0 0 16 16" width="10" height="10">
            <path
              d="M3 8.5L6.2 11.5L13 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="10" height="10">
            <circle
              cx="8"
              cy="8"
              r="5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeDasharray="2.2 2.2"
            />
          </svg>
        )}
      </span>
      {confidence}
    </span>
  );
}
