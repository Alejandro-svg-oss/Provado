import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Shell } from "../components/Shell";
import styles from "./SearchingPage.module.css";

const STAGES = ["Rastreando fuentes…", "Extrayendo players…", "Evaluando confianza…"];

// Ciclo cosmético entre etapas mientras esperamos el resultado real de Convex
// (ver validations.ts: status pasa de "searching" a "done" o "error").
const STAGE_CYCLE_MS = 1400;

export function SearchingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);

  const state = location.state as { validationId?: Id<"validations"> } | null;
  const validationId = state?.validationId;

  const validation = useQuery(
    api.validations.get,
    validationId ? { id: validationId } : "skip",
  );

  useEffect(() => {
    if (!validationId) {
      navigate("/", { replace: true });
    }
  }, [validationId, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((current) => (current + 1) % STAGES.length);
    }, STAGE_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!validation) return;

    if (validation.status === "done") {
      navigate("/resultados", { state: { validationId }, replace: true });
    }
  }, [validation, navigate, validationId]);

  if (validation?.status === "error") {
    return (
      <Shell>
        <section className={styles.wrap}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>No se pudo completar la búsqueda</p>
            <p className={styles.errorText}>
              {validation.errorMessage ??
                "Algo falló al buscar evidencia. Prueba con un problema y solución más específicos."}
            </p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => navigate("/buscar", { replace: true })}
            >
              Intentar de nuevo
            </button>
          </div>
        </section>
      </Shell>
    );
  }

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
