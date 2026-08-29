import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Shell } from "../components/Shell";
import { PlayerCard } from "../components/PlayerCard";
import { VoiceButton } from "../components/VoiceButton";
import styles from "./ResultsPage.module.css";

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { validationId?: Id<"validations"> } | null;
  const validationId = state?.validationId;

  const validation = useQuery(
    api.validations.get,
    validationId ? { id: validationId } : "skip",
  );

  if (!validationId) {
    return (
      <Shell>
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Resultados</p>
          <h1 className={styles.title}>No hay una búsqueda para mostrar</h1>
          <p className={styles.solution}>Mete un problema y una solución para empezar.</p>
          <div className={styles.footer}>
            <button type="button" className={styles.newSearch} onClick={() => navigate("/")}>
              Nueva búsqueda
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  if (validation === undefined) {
    return (
      <Shell>
        <section className={styles.wrap}>
          <p className={`${styles.eyebrow} mono`}>Cargando resultados…</p>
        </section>
      </Shell>
    );
  }

  if (validation === null) {
    return (
      <Shell>
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Resultados</p>
          <h1 className={styles.title}>No encontramos esta búsqueda</h1>
          <p className={styles.solution}>Puede que haya sido de otra cuenta o ya no exista.</p>
          <div className={styles.footer}>
            <button type="button" className={styles.newSearch} onClick={() => navigate("/")}>
              Nueva búsqueda
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  const { problem, solution, gap, players } = validation;
  const confirmedCount = players.filter((p) => p.confidence === "confirmado").length;
  const probableCount = players.length - confirmedCount;

  const summaryForVoice = `${players.length} players encontrados. ${confirmedCount} confirmados, ${probableCount} probables. Hueco: ${gap ?? ""}`;

  return (
    <Shell>
      <section className={styles.wrap}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Resultados</p>
          <h1 className={styles.title}>{problem}</h1>
          <p className={styles.solution}>{solution}</p>

          <div className={styles.tally}>
            <span className={styles.tallyItem}>
              <strong>{confirmedCount}</strong> confirmados
            </span>
            <span className={styles.tallyItem}>
              <strong>{probableCount}</strong> probables
            </span>
          </div>
        </div>

        {players.length === 0 ? (
          <p className={styles.solution}>
            No encontramos players para esta búsqueda todavía.
          </p>
        ) : (
          <div className={styles.list}>
            {players.map((player) => (
              <PlayerCard key={player._id} player={player} />
            ))}
          </div>
        )}

        {gap && (
          <div className={styles.gap}>
            <p className={styles.gapLabel}>Hueco concreto</p>
            <p className={`${styles.gapText} mono`}>{gap}</p>
          </div>
        )}

        <div className={styles.footer}>
          <VoiceButton summary={summaryForVoice} />
          <button type="button" className={styles.newSearch} onClick={() => navigate("/")}>
            Nueva búsqueda
          </button>
        </div>
      </section>
    </Shell>
  );
}
