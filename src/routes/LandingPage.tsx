import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Shell } from "../components/Shell";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import styles from "./LandingPage.module.css";

const STATS = [
  {
    value: "42%",
    label: "de las startups fracasan por construir algo que nadie necesita",
    source: "CB Insights",
    sourceUrl: "https://www.cbinsights.com/research/report/startup-failure-reasons-top/",
  },
  {
    value: "73%",
    label: "de las startups B2B fallan por saltarse la validación sistemática",
    source: "User Intuition",
    sourceUrl: "https://www.userintuition.ai/reference-guides/why-startups-fail-no-market-need-research/",
  },
  {
    value: "18%→35%",
    label: "así casi se duplicó la tasa de afirmaciones falsas de los chatbots de IA en un año",
    source: "NewsGuard, 2025",
    sourceUrl: "https://www.vktr.com/ai-technology/ai-hallucinations-nearly-double-heres-why-theyre-getting-worse-not-better/",
  },
  {
    value: "3–6 meses",
    label: "y hasta $50,000 toma una validación de mercado tradicional",
    source: "Unbuilt Lab",
    sourceUrl: "https://unbuiltlab.com/blog/startup-validation-before-building-stop-wasting-6-months.html",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  function handleCta() {
    navigate(isSignedIn ? "/buscar" : "/entrar");
  }

  return (
    <Shell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Provado</p>
          <h1 className={styles.title}>
            No adivines si tu idea ya tiene competencia. Compruébalo.
          </h1>
          <p className={styles.subtitle}>
            Metes un problema y una solución. Buscamos en vivo quién ya lo está
            atacando, citamos la fuente de cada dato y marcamos con claridad
            qué es evidencia confirmada y qué es una suposición. Nada
            inventado, nada disfrazado de hecho.
          </p>
          <button type="button" className={styles.cta} onClick={handleCta}>
            Probar con mi idea
          </button>
        </div>
      </section>

      <section className={styles.stats} aria-label="Por qué importa validar con evidencia">
        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
              <a
                className={`${styles.statSource} mono`}
                href={stat.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {stat.source}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.explainer}>
        <div className={styles.explainerInner}>
          <p className={styles.eyebrow}>El sistema de confianza</p>
          <h2 className={styles.explainerTitle}>
            Cada dato dice qué tan seguro estamos de él
          </h2>
          <p className={styles.explainerText}>
            Las herramientas de IA suelen presentar todo con la misma
            seguridad, aunque estén inventando. Provado etiqueta cada player
            que encuentra: si tiene una fuente clickeable, es{" "}
            <strong>confirmado</strong>. Si no la tiene, es{" "}
            <strong>probable</strong> — y se ve distinto, no solo con color,
            para que no se confunda con un hecho.
          </p>
          <div className={styles.badgeRow}>
            <ConfidenceBadge confidence="confirmado" />
            <ConfidenceBadge confidence="probable" />
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className={styles.closingInner}>
          <h2 className={styles.closingTitle}>Mete tu idea. Ve la evidencia real.</h2>
          <button type="button" className={styles.cta} onClick={handleCta}>
            Probar con mi idea
          </button>
        </div>
      </section>
    </Shell>
  );
}
