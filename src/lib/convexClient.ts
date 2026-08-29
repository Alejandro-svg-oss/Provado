import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  // Aviso en consola, no un crash: el cascarón debe verse completo con mock
  // aunque todavía no exista un deployment de Convex conectado.
  console.warn(
    "VITE_CONVEX_URL no está definida. Configúrala en .env.local para conectar Convex.",
  );
}

export const convex = new ConvexReactClient(
  convexUrl && convexUrl.length > 0 ? convexUrl : "https://placeholder.convex.cloud",
);
