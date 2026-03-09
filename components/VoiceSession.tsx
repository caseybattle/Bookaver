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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Talk to "{bookTitle}"</h2>
        <p className="text-sm text-gray-400">
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
                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
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
          <p className="text-sm text-indigo-400 animate-pulse flex items-center gap-1.5">
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
