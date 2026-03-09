"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVapi } from "./client";
import type Vapi from "@vapi-ai/web";

export type CallStatus = "idle" | "connecting" | "active" | "ending";

export interface UseVapiReturn {
  callStatus: CallStatus;
  isSpeaking: boolean;
  error: string | null;
  startCall: (assistantId: string, bookId: string, personaId: string) => Promise<void>;
  stopCall: () => void;
  sessionId: string | null;
}

export function useVapi(): UseVapiReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);

  useEffect(() => {
    try {
      const vapi = getVapi();
      vapiRef.current = vapi;

      const onCallStart = () => setCallStatus("active");
      const onCallEnd = () => {
        setCallStatus("idle");
        setIsSpeaking(false);
      };
      const onSpeechStart = () => setIsSpeaking(true);
      const onSpeechEnd = () => setIsSpeaking(false);
      const onError = (err: Error) => {
        setError(err.message);
        setCallStatus("idle");
      };

      vapi.on("call-start", onCallStart);
      vapi.on("call-end", onCallEnd);
      vapi.on("speech-start", onSpeechStart);
      vapi.on("speech-end", onSpeechEnd);
      vapi.on("error", onError);

      return () => {
        vapi.off("call-start", onCallStart);
        vapi.off("call-end", onCallEnd);
        vapi.off("speech-start", onSpeechStart);
        vapi.off("speech-end", onSpeechEnd);
        vapi.off("error", onError);
      };
    } catch {
      // Vapi not available yet
    }
  }, []);

  const startCall = useCallback(
    async (assistantId: string, bookId: string, personaId: string) => {
      setError(null);
      setCallStatus("connecting");
      try {
        const vapi = vapiRef.current ?? getVapi();
        // Start the Vapi call with metadata passed as overrides
        await vapi.start(assistantId, {
          variableValues: {
            bookId,
            personaId,
            searchEndpoint: `${window.location.origin}/api/vapi/search-book`,
          },
        });
        setSessionId(crypto.randomUUID());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start call");
        setCallStatus("idle");
      }
    },
    []
  );

  const stopCall = useCallback(() => {
    setCallStatus("ending");
    try {
      vapiRef.current?.stop();
    } catch {
      setCallStatus("idle");
    }
  }, []);

  return { callStatus, isSpeaking, error, startCall, stopCall, sessionId };
}
