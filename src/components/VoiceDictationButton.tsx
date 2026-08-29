import { useSpeechDictation } from "../hooks/useSpeechDictation";
import styles from "./VoiceDictationButton.module.css";

// Dicta un campo de texto con el reconocimiento de voz nativo del navegador:
// transcribe en vivo lo que dices, sin conversación ni respuesta de nadie.
// (Vapi se reserva para la llamada conversacional en /resultados.)
export function VoiceDictationButton({
  onDictated,
  label,
}: {
  onDictated: (text: string) => void;
  label: string;
}) {
  const { isListening, isSupported, startListening, stopListening } =
    useSpeechDictation(onDictated);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={`${styles.button} ${isListening ? styles.active : ""}`}
      onClick={isListening ? stopListening : startListening}
      aria-pressed={isListening}
      aria-label={isListening ? `Detener dictado de ${label}` : `Dictar ${label} por voz`}
      title={isListening ? "Detener dictado" : "Dictar por voz"}
    >
      <span className={styles.icon} aria-hidden="true">
        {isListening ? (
          <span className={styles.pulse} />
        ) : (
          <svg width="13" height="13" viewBox="0 0 16 16">
            <rect x="6" y="1" width="4" height="8" rx="2" fill="currentColor" />
            <path
              d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      {isListening ? "Escuchando…" : "Dictar"}
    </button>
  );
}
