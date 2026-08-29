import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Shell.module.css";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          Provado
        </NavLink>

        <nav className={styles.nav} aria-label="Navegación principal">
          <NavLink
            to="/buscar"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Buscar
          </NavLink>
          <NavLink
            to="/historial"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Historial
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <NavLink to="/entrar" className={styles.signIn}>
              Entrar
            </NavLink>
          </SignedOut>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
