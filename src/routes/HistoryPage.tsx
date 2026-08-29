import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Shell } from "../components/Shell";
import styles from "./HistoryPage.module.css";

function formatRelativeDate(timestamp: number): string {
  const days = Math.round((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  return `Hace ${days} días`;
}

export function HistoryPage() {
  const [semanticQuery, setSemanticQuery] = useState("");
  const navigate = useNavigate();

  const validations = useQuery(api.validations.list);
  // TODO(semantic): vector search de Convex sobre el historial del usuario.
  // Opcional: si no se implementa, el historial completo sigue siendo
  // navegable con la lista de abajo (filtro de texto simple).
  const searchResults = useQuery(
    api.search.searchHistory,
    semanticQuery.trim() ? { queryText: semanticQuery } : "skip",
  );

  const filtered = semanticQuery.trim() ? (searchResults ?? []) : (validations ?? []);

  return (
    <Shell>
      <SignedIn>
        <section className={styles.wrap}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Historial</p>
            <h1 className={styles.title}>Tus validaciones</h1>
          </div>

          <div className={styles.searchBox}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Busca entre tus validaciones"
              value={semanticQuery}
              onChange={(event) => setSemanticQuery(event.target.value)}
              aria-label="Buscar entre tus validaciones"
            />
            <span className={`${styles.searchBadge} mono`}>Búsqueda semántica próximamente</span>
          </div>

          {validations === undefined ? (
            <p className={styles.empty}>Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>
              {validations.length === 0
                ? "Mete un problema y una solución para empezar."
                : "No encontramos validaciones que coincidan con esa búsqueda."}
            </p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() =>
                      navigate("/resultados", {
                        state: { validationId: item._id },
                      })
                    }
                  >
                    <div className={styles.itemMain}>
                      <p className={styles.itemProblem}>{item.problem}</p>
                      <p className={styles.itemSolution}>
                        {item.solution ?? "Sin solución propuesta — busca soluciones existentes"}
                      </p>
                    </div>
                    <span className={`${styles.itemDate} mono`}>
                      {formatRelativeDate(item.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SignedIn>

      <SignedOut>
        <section className={styles.signedOut}>
          <p className={styles.eyebrow}>Historial</p>
          <h1 className={styles.title}>Entra para ver tus validaciones</h1>
          <p className={styles.subtitle}>
            Guardamos cada búsqueda de evidencia en tu cuenta para que puedas volver a ella.
          </p>
          <button type="button" className={styles.cta} onClick={() => navigate("/entrar")}>
            Entrar
          </button>
        </section>
      </SignedOut>
    </Shell>
  );
}
