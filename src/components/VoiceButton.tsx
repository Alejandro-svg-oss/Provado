import { useState } from "react";
import styles from "./VoiceButton.module.css";

// TODO(elevenlabs): síntesis de voz del resumen de resultados — opcional,
// no bloquear el core. Este botón solo simula el estado de reproducción.
export function VoiceButton({ summary }: { summary: string }) {
  const [playing, setPlaying] = useState(false);

  function handleClick() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 2200);
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-pressed={playing}
      aria-label={playing ? "Detener resumen en voz" : "Escuchar resumen en voz"}
      title="Voz (próximamente)"
    >
      <span className={styles.icon} aria-hidden="true">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 16 16">
            <rect x="3" y="3" width="4" height="10" fill="currentColor" />
            <rect x="9" y="3" width="4" height="10" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M4 5.5v5h2.5L10 14V2L6.5 5.5H4z" fill="currentColor" />
          </svg>
        )}
      </span>
      {playing ? "Reproduciendo…" : "Escuchar resumen"}
      <span className={styles.badge}>Próximamente</span>
      <span className="visually-hidden">{summary}</span>
    </button>
  );
}
