"use client";

import { useCallback, useState } from "react";
import { useVapi } from "@/lib/vapi/useVapi";
import MicrophoneButton from "@/components/MicrophoneButton";
import { VOICE_PERSONAS } from "@/lib/vapi/constants";
import { Mic } from "lucide-react";

interface VoiceSessionProps {
  bookId: string;
  bookTitle: string;
  assistantId: string;
}

export default function VoiceSession({ bookId, bookTitle, assistantId }: VoiceSessionProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState("scholar");
  const { callStatus, isSpeaking, error, startCall, stopCall } = useVapi();

  const handleStart = useCallback(async () => {
    await startCall(assistantId, bookId, selectedPersonaId);
  }, [assistantId, bookId, selectedPersonaId, startCall]);

  return (
    <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Talk to "{bookTitle}"</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {callStatus === "idle"
            ? "Choose a voice persona and press the mic to start"
            : callStatus === "connecting"
            ? "Connecting…"
            : callStatus === "active"
            ? "Conversation active — press to end"
            : "Ending call…"}
        </p>
      </div>

      {/* Persona selector — only visible when idle */}
      {callStatus === "idle" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VOICE_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelectedPersonaId(persona.id)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                selectedPersonaId === persona.id
                  ? "border-amber-500 bg-amber-500/10 text-stone-900 dark:text-stone-50"
                  : "border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600"
              }`}
            >
              <p className="font-medium text-sm">{persona.name}</p>
              <p className="text-xs mt-0.5 opacity-70">{persona.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Mic button centered */}
      <div className="flex flex-col items-center gap-4">
        <MicrophoneButton
          callStatus={callStatus}
          isSpeaking={isSpeaking}
          onStart={handleStart}
          onStop={stopCall}
        />
        {isSpeaking && (
          <p className="text-sm text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            AI is speaking…
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
