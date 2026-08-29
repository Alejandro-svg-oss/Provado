import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Shell } from "../components/Shell";
import { PlayerCard } from "../components/PlayerCard";
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
            <button type="button" className={styles.newSearch} onClick={() => navigate("/buscar")}>
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
            <button type="button" className={styles.newSearch} onClick={() => navigate("/buscar")}>
              Nueva búsqueda
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  const {
    problem,
    solution,
    gap,
    verdict,
    players,
    marketSignalProducts,
    marketSignalContentPieces,
    zeroReason,
  } = validation;
  const isSoloProblemMode = !solution;
  const noDataFound = zeroReason === "no_candidates";
  const confirmedCount = players.filter((p) => p.confidence === "confirmado").length;
  const probableCount = players.length - confirmedCount;
  const listLabel = isSoloProblemMode ? "Soluciones existentes" : "Players";

  const hasMarketSignal =
    typeof marketSignalProducts === "number" && typeof marketSignalContentPieces === "number";

  return (
    <Shell>
      <section className={styles.wrap}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Resultados</p>
          <h1 className={styles.title}>{problem}</h1>
          {solution && <p className={styles.solution}>{solution}</p>}

          <div className={styles.tally}>
            <span className={styles.tallyItem}>
              <strong>{confirmedCount}</strong> confirmados
            </span>
            <span className={styles.tallyItem}>
              <strong>{probableCount}</strong> probables
            </span>
          </div>
        </div>

        {noDataFound ? (
          <div className={styles.noData}>
            <p className={styles.noDataText}>
              La búsqueda no devolvió resultados; puede ser un problema muy nuevo o una
              query demasiado específica. Vale la pena reformular.
            </p>
          </div>
        ) : (
          <>
            {verdict && (
              <div className={styles.verdict}>
                <p className={styles.verdictText}>{verdict}</p>
                <div className={styles.verdictMeta}>
                  {hasMarketSignal && (
                    <span className={`${styles.marketSignal} mono`}>
                      {marketSignalProducts} producto{marketSignalProducts === 1 ? "" : "s"} real
                      {marketSignalProducts === 1 ? "" : "es"} · {marketSignalContentPieces}{" "}
                      artículo{marketSignalContentPieces === 1 ? "" : "s"} sobre el tema
                    </span>
                  )}
                  <p className={`${styles.verdictNote} mono`}>
                    Fuente verificada de la web, no generada por IA
                  </p>
                </div>
              </div>
            )}

            {gap && (
              <div className={styles.gap}>
                <p className={styles.gapLabel}>Hueco concreto</p>
                <p className={`${styles.gapText} mono`}>{gap}</p>
              </div>
            )}
          </>
        )}

        {!noDataFound &&
          (players.length === 0 ? (
            <p className={styles.solution}>
              No encontramos {isSoloProblemMode ? "soluciones" : "players"} para esta búsqueda
              todavía.
            </p>
          ) : (
            <div className={styles.list}>
              <p className={styles.listLabel}>{listLabel}</p>
              {players.map((player) => (
                <PlayerCard key={player._id} player={player} />
              ))}
            </div>
          ))}

        <div className={styles.footer}>
          <button type="button" className={styles.newSearch} onClick={() => navigate("/buscar")}>
            Nueva búsqueda
          </button>
        </div>
      </section>
    </Shell>
  );
}
