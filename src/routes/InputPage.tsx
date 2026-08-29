import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Shell } from "../components/Shell";
import styles from "./InputPage.module.css";

export function InputPage() {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const createValidation = useMutation(api.validations.create);
  const { isSignedIn, isLoaded } = useUser();

  const canSubmit =
    isSignedIn === true && problem.trim().length > 0 && solution.trim().length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const validationId = await createValidation({ problem, solution });
      navigate("/buscando", { state: { validationId } });
    } catch (error) {
      console.error("No se pudo crear la validación:", error);
      setErrorMessage("No pudimos iniciar la búsqueda. Intenta de nuevo.");
      setSubmitting(false);
    }
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

          {isLoaded && !isSignedIn ? (
            <div className={styles.authGate}>
              <p className={styles.authGateText}>
                Necesitas una cuenta para buscar evidencia y guardar tus validaciones.
              </p>
              <button
                type="button"
                className={styles.submit}
                onClick={() => navigate("/entrar")}
              >
                Entrar para buscar evidencia
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
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

              {errorMessage && <p className={styles.error}>{errorMessage}</p>}

              <button type="submit" className={styles.submit} disabled={!canSubmit}>
                {submitting ? "Buscando…" : "Buscar evidencia"}
              </button>
            </form>
          )}
        </div>
      </section>
    </Shell>
  );
}
