import { useCallback, useEffect, useRef, useState } from "react";

// Reconocimiento de voz nativo del navegador (Web Speech API) para dictar
// un campo de texto en vivo. A diferencia de Vapi (llamadas conversacionales
// con un asistente que responde), esto es transcripción pura: nadie contesta,
// solo se transcribe lo que el usuario dice.
//
// Soporte: Chrome/Edge (webkitSpeechRecognition). Safari/Firefox no lo
// implementan — el hook expone isSupported para que el botón se oculte ahí.

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechDictation(onDictated: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalBufferRef = useRef("");

  const isSupported = typeof window !== "undefined" && getSpeechRecognitionCtor() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    finalBufferRef.current = "";
    const recognition = new Ctor();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: unknown) => {
      const e = event as {
        resultIndex: number;
        results: { [i: number]: { 0: { transcript: string }; isFinal: boolean }; length: number };
      };
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalBufferRef.current = `${finalBufferRef.current} ${text}`.trim();
        } else {
          interim += text;
        }
      }
      onDictated(`${finalBufferRef.current} ${interim}`.trim());
    };

    recognition.onerror = (event: unknown) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onDictated]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
