import { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Shell } from "../components/Shell";
import { useTheme } from "../context/theme";
import styles from "./AuthPage.module.css";

// Alinea el widget de Clerk con los tokens de Provado en vez de dejar su
// tema default (que trae su propia paleta e Inter).
function useClerkAppearance() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    variables: {
      colorPrimary: isDark ? "#6b8bff" : "#2e4bf2",
      colorBackground: isDark ? "#17171c" : "#ffffff",
      colorText: isDark ? "#ededf0" : "#16161a",
      colorTextSecondary: isDark ? "#9a9aa2" : "#6b6b72",
      colorInputBackground: isDark ? "#0e0e11" : "#f7f7f5",
      colorInputText: isDark ? "#ededf0" : "#16161a",
      borderRadius: "8px",
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
    },
  };
}

export function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const appearance = useClerkAppearance();

  return (
    <Shell>
      <section className={styles.wrap}>
        <div className={styles.tabs} role="tablist" aria-label="Elegir entre entrar o crear cuenta">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-in"}
            className={`${styles.tab} ${mode === "sign-in" ? styles.tabActive : ""}`}
            onClick={() => setMode("sign-in")}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-up"}
            className={`${styles.tab} ${mode === "sign-up" ? styles.tabActive : ""}`}
            onClick={() => setMode("sign-up")}
          >
            Crear cuenta
          </button>
        </div>

        <div className={styles.clerkWrap}>
          {mode === "sign-in" ? (
            <SignIn
              routing="hash"
              signUpUrl="/entrar"
              forceRedirectUrl="/buscar"
              appearance={appearance}
            />
          ) : (
            <SignUp
              routing="hash"
              signInUrl="/entrar"
              forceRedirectUrl="/buscar"
              appearance={appearance}
            />
          )}
        </div>
      </section>
    </Shell>
  );
}
