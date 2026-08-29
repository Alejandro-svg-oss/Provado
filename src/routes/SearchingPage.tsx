import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import styles from "./SearchingPage.module.css";

const STAGES = [
  "Rastreando fuentes…",
  "Extrayendo players…",
  "Evaluando confianza…",
];

// Duración simulada por etapa. En producción, el avance real vendría de leer
// el estado de la validación en Convex (ver validations.ts: status "searching").
const STAGE_DURATION_MS = 900;

export function SearchingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);

  const state = location.state as { problem?: string; solution?: string } | null;

  useEffect(() => {
    if (!state?.problem || !state?.solution) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) {
      const timeout = setTimeout(() => {
        navigate("/resultados", { state, replace: true });
      }, STAGE_DURATION_MS);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setStageIndex((current) => current + 1);
    }, STAGE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [stageIndex, navigate, state]);

  return (
    <Shell>
      <section className={styles.wrap}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Buscando evidencia</p>
          <ul className={styles.stages}>
            {STAGES.map((stage, index) => {
              const done = index < stageIndex;
              const active = index === stageIndex;
              return (
                <li
                  key={stage}
                  className={`${styles.stage} ${done ? styles.stageDone : ""} ${
                    active ? styles.stageActive : ""
                  }`}
                >
                  <span className={styles.marker} aria-hidden="true">
                    {done ? (
                      <svg viewBox="0 0 16 16" width="12" height="12">
                        <path
                          d="M3 8.5L6.2 11.5L13 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : active ? (
                      <span className={styles.pulse} />
                    ) : (
                      <span className={styles.dot} />
                    )}
                  </span>
                  <span className={styles.stageLabel}>{stage}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
