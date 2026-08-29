# Guia rapida para Claude — Vapi solo transcripcion (voz a texto)

Este documento define la forma **mas rapida y simple** de integrar Vapi para que el usuario diga su idea y el texto se coloque automaticamente en el input.

## Alcance (estricto)

- Solo **transcripcion** (voz -> texto).
- No tools de Vapi.
- No llamadas a Apify desde Vapi.
- No cambios de backend para esta fase.

## Variables necesarias (las compartes por separado)

- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`

La public key puede vivir en frontend. Nunca guardar private keys en cliente.

## Opcion recomendada (mas simple para autollenar input)

Usar **Web SDK**: `@vapi-ai/web`

### 1) Instalar

```bash
npm install @vapi-ai/web
```

### 2) Flujo UX minimo

1. Boton: "Hablar idea"
2. Iniciar llamada `vapi.start(assistantId)`
3. Escuchar `message`
4. Si llega `message.type === "transcript"` y `message.role === "user"`, actualizar el textarea
5. Al terminar, `vapi.stop()`

### 3) Snippet base (React)

```tsx
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

export function IdeaDictation() {
  const [idea, setIdea] = useState("");
  const [connected, setConnected] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
    if (!key || !assistantId) return;

    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setConnected(true));
    vapi.on("call-end", () => setConnected(false));

    vapi.on("message", (message: any) => {
      if (message.type !== "transcript") return;
      if (message.role !== "user") return;

      // Si quieres solo texto estable:
      // if ((message.transcriptType ?? "final") !== "final") return;
      setIdea(message.transcript ?? "");
    });

    vapi.on("error", (e) => console.error("Vapi error", e));

    return () => {
      vapi.stop();
    };
  }, []);

  const start = () => {
    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
    if (!vapiRef.current || !assistantId) return;
    vapiRef.current.start(assistantId);
  };

  const stop = () => vapiRef.current?.stop();

  return (
    <div>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe tu idea..."
      />
      {!connected ? (
        <button onClick={start}>Hablar idea</button>
      ) : (
        <button onClick={stop}>Detener</button>
      )}
    </div>
  );
}
```

## Configuracion del assistant (minima)

- Idioma: espanol.
- Instruccion principal: "Transcribe con fidelidad lo que diga el usuario, sin resumir."
- Mensajes cliente: incluir `transcript`.

## Reglas para Claude al implementarlo

- No tocar scraping ni Convex en esta tarea.
- No agregar features extra.
- No bloquear submit manual del textarea.
- Manejar fallback: si no hay microfono/permisos, mostrar error simple y seguir permitiendo input escrito.

## Criterio de listo

- Usuario pulsa "Hablar idea", habla, y el texto aparece en el input.
- Usuario puede editar manualmente el texto antes de enviar.
- Si se corta la llamada, el input mantiene la ultima transcripcion recibida.
