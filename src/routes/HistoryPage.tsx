import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Shell } from "../components/Shell";
import { formatRelativeDate, MOCK_HISTORY } from "../mocks/history";
import styles from "./HistoryPage.module.css";

export function HistoryPage() {
  const [semanticQuery, setSemanticQuery] = useState("");
  const navigate = useNavigate();

  // TODO(semantic): vector search de Convex sobre el historial del usuario.
  // Opcional: si no se implementa, el historial completo sigue siendo
  // navegable con la lista de abajo.
  const filtered = semanticQuery.trim()
    ? MOCK_HISTORY.filter((item) =>
        `${item.problem} ${item.solution}`
          .toLowerCase()
          .includes(semanticQuery.trim().toLowerCase()),
      )
    : MOCK_HISTORY;

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

          {filtered.length === 0 ? (
            <p className={styles.empty}>No encontramos validaciones que coincidan con esa búsqueda.</p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() =>
                      navigate("/resultados", {
                        state: { problem: item.problem, solution: item.solution },
                      })
                    }
                  >
                    <div className={styles.itemMain}>
                      <p className={styles.itemProblem}>{item.problem}</p>
                      <p className={styles.itemSolution}>{item.solution}</p>
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
