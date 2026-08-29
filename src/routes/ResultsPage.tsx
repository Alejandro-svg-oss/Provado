import { useLocation, useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import { PlayerCard } from "../components/PlayerCard";
import { VoiceButton } from "../components/VoiceButton";
import { MOCK_GAP, MOCK_PLAYERS } from "../mocks/results";
import styles from "./ResultsPage.module.css";

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { problem?: string; solution?: string } | null;
  const problem = state?.problem ?? "Los equipos remotos pierden contexto entre reuniones y docs";
  const solution =
    state?.solution ?? "Un asistente que resume decisiones y las liga a la tarea correspondiente";

  const confirmedCount = MOCK_PLAYERS.filter((p) => p.confidence === "confirmado").length;
  const probableCount = MOCK_PLAYERS.length - confirmedCount;

  const summaryForVoice = `${MOCK_PLAYERS.length} players encontrados. ${confirmedCount} confirmados, ${probableCount} probables. Hueco: ${MOCK_GAP}`;

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

        <div className={styles.list}>
          {MOCK_PLAYERS.map((player) => (
            <PlayerCard key={player.name} player={player} />
          ))}
        </div>

        <div className={styles.gap}>
          <p className={styles.gapLabel}>Hueco concreto</p>
          <p className={`${styles.gapText} mono`}>{MOCK_GAP}</p>
        </div>

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
