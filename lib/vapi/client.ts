import Vapi from "@vapi-ai/web";

let vapiInstance: Vapi | null = null;

export function getVapi(): Vapi {
  if (typeof window === "undefined") {
    throw new Error("Vapi can only be used in the browser");
  }
  if (!vapiInstance) {
    const key = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_VAPI_API_KEY is not set");
    vapiInstance = new Vapi(key);
  }
  return vapiInstance;
}
