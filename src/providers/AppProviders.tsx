import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "../lib/convexClient";
import { ThemeProvider } from "../context/theme";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!clerkPublishableKey) {
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY no está definida. Configúrala en .env.local para conectar Clerk.",
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkProvider publishableKey={clerkPublishableKey ?? "pk_test_placeholder"}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ThemeProvider>
  );
}
