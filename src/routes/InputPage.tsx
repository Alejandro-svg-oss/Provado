import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import styles from "./InputPage.module.css";

export function InputPage() {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const navigate = useNavigate();

  const canSubmit = problem.trim().length > 0 && solution.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    // TODO(apify): al enviar, se crea una validación en Convex (mutation)
    // y el pipeline de scraping (Apify) empieza a poblar `scrapedSources`.
    // TODO(deepseek): la action de Convex procesa esas fuentes y decide
    // confirmado/probable por cada player.
    navigate("/buscando", { state: { problem, solution } });
  }

  return (
    <Shell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Provado</p>
          <h1 className={styles.title}>Valida tu idea contra evidencia real</h1>
          <p className={styles.subtitle}>
            Describe el problema y tu solución. Buscamos quién ya lo está
            atacando, citamos la fuente y marcamos qué es evidencia confirmada
            y qué es una suposición.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="problem">
                Problema
              </label>
              <textarea
                id="problem"
                className={styles.textarea}
                placeholder="¿Qué dolor concreto tiene tu usuario?"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                rows={3}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="solution">
                Solución
              </label>
              <textarea
                id="solution"
                className={styles.textarea}
                placeholder="¿Cómo lo resuelves?"
                value={solution}
                onChange={(event) => setSolution(event.target.value)}
                rows={3}
                required
              />
            </div>

            <button type="submit" className={styles.submit} disabled={!canSubmit}>
              Buscar evidencia
            </button>
          </form>
        </div>
      </section>
    </Shell>
  );
}
