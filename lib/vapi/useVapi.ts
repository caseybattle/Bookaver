"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVapi } from "./client";
import type Vapi from "@vapi-ai/web";
import { VOICE_PERSONAS } from "./constants";
import {
  startVoiceSession,
  endVoiceSession,
} from "@/lib/actions/session.actions";

export type CallStatus = "idle" | "connecting" | "active" | "ending";

export interface UseVapiReturn {
  callStatus: CallStatus;
  isSpeaking: boolean;
  error: string | null;
  startCall: (assistantId: string, bookId: string, personaId: string, bookTitle: string) => Promise<void>;
  stopCall: () => void;
  sessionId: string | null;
}

export function useVapi(): UseVapiReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  // Refs for DB session tracking — readable by the call-end event handler
  const dbSessionIdRef = useRef<string | null>(null);
  const vapiCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const vapi = getVapi();
      vapiRef.current = vapi;

      const onCallStart = () => setCallStatus("active");

      // Async handler: persist session end to DB when Vapi closes the call
      const onCallEnd = async () => {
        if (dbSessionIdRef.current) {
          try {
            await endVoiceSession(
              dbSessionIdRef.current,
              vapiCallIdRef.current ?? undefined
            );
          } catch {
            // Don't block UI on billing errors — session data is best-effort
          }
          dbSessionIdRef.current = null;
          vapiCallIdRef.current = null;
        }
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
    async (assistantId: string, bookId: string, personaId: string, bookTitle: string) => {
      setError(null);
      setCallStatus("connecting");

      let dbSessionId: string | null = null;
      try {
        // 1. Create the DB session record BEFORE starting the Vapi call
        const { sessionId: sid } = await startVoiceSession(bookId, personaId);
        dbSessionId = sid;
        dbSessionIdRef.current = sid;

        // 2. Build per-persona system prompt override
        const persona = VOICE_PERSONAS.find((p) => p.id === personaId);
        const systemPrompt = (persona?.systemPrompt ?? "").replace(
          /\{\{bookTitle\}\}/g,
          bookTitle
        );

        // 3. Start the Vapi call and capture the call object for its ID
        const vapi = vapiRef.current ?? getVapi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const call = await (vapi.start as any)(assistantId, {
          variableValues: {
            bookId,
            personaId,
            bookTitle,
            searchEndpoint: `${window.location.origin}/api/vapi/search-book`,
          },
          assistantOverrides: {
            // Inject persona system prompt — MERGES with dashboard config so
            // tool definitions (searchBook) are preserved.
            ...(systemPrompt && {
              model: {
                messages: [{ role: "system", content: systemPrompt }],
              },
            }),
            // Stop speaking quickly when user starts talking (numWords = 2 words
            // of user speech triggers the AI to stop).
            stopSpeakingPlan: {
              numWords: 2,
              voiceSeconds: 0.3,
              backoffSeconds: 1.0,
            },
            // Brief natural pause before AI responds after user stops talking.
            responseDelaySeconds: 0.5,
          },
        });

        // 4. Store Vapi call ID so it gets saved when the call ends
        vapiCallIdRef.current = (call as { id?: string } | null)?.id ?? null;

        setSessionId(sid);
      } catch (err) {
        // If DB session was created but Vapi failed, close the orphaned record
        if (dbSessionId) {
          try {
            await endVoiceSession(dbSessionId);
          } catch {
            // silent
          }
          dbSessionIdRef.current = null;
        }
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
