export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  voiceId: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "scholar",
    name: "The Scholar",
    description: "Academic and thorough — great for non-fiction and textbooks",
    voiceId: "aura-asteria-en",
  },
  {
    id: "storyteller",
    name: "The Storyteller",
    description: "Warm and engaging — perfect for fiction and memoirs",
    voiceId: "aura-luna-en",
  },
  {
    id: "coach",
    name: "The Coach",
    description: "Motivating and direct — ideal for self-help and business books",
    voiceId: "aura-zeus-en",
  },
];

export const DEFAULT_PERSONA_ID = "scholar";
