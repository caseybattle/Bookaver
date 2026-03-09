"use client";

import { Mic, MicOff, Loader2, PhoneOff } from "lucide-react";
import type { CallStatus } from "@/lib/vapi/useVapi";

interface MicrophoneButtonProps {
  callStatus: CallStatus;
  isSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function MicrophoneButton({
  callStatus,
  isSpeaking,
  onStart,
  onStop,
}: MicrophoneButtonProps) {
  const isIdle = callStatus === "idle";
  const isConnecting = callStatus === "connecting";
  const isActive = callStatus === "active";
  const isEnding = callStatus === "ending";

  const handleClick = () => {
    if (isIdle) onStart();
    else if (isActive) onStop();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting || isEnding}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed ${
        isActive
          ? "bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30"
          : isConnecting || isEnding
          ? "bg-gray-800"
          : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
      }`}
      aria-label={isActive ? "Stop conversation" : "Start conversation"}
    >
      {/* Pulse ring when AI is speaking */}
      {isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
      )}

      {isConnecting || isEnding ? (
        <Loader2 className="w-7 h-7 text-white animate-spin" />
      ) : isActive ? (
        <PhoneOff className="w-7 h-7 text-white" />
      ) : (
        <Mic className="w-7 h-7 text-white" />
      )}
    </button>
  );
}
