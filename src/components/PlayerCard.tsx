import type { Player } from "../mocks/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import styles from "./PlayerCard.module.css";

export function PlayerCard({ player }: { player: Player }) {
  const isConfirmed = player.confidence === "confirmado";

  return (
    <article className={`${styles.card} ${isConfirmed ? styles.confirmed : styles.probable}`}>
      <div className={styles.header}>
        <h3 className={styles.name}>{player.name}</h3>
        <ConfidenceBadge confidence={player.confidence} />
      </div>

      <p className={styles.where}>{player.whereItWorks}</p>

      {player.sourceUrl ? (
        <a
          className={`${styles.source} mono`}
          href={player.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {player.sourceUrl.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <span className={`${styles.sourceMissing} mono`}>Sin fuente verificable todavía</span>
      )}
    </article>
  );
}
