export const API_ENDPOINTS = {
  GREGIFY: "https://n8n-fckr.onrender.com/webhook-test/9efe590c-2792-4468-8094-613c55c7ab89",
};

export const MODELS = [
  { value: "gpt4", label: "GPT-4" },
  { value: "claude", label: "Claude-3.5" },
  { value: "gemini", label: "Gemini Pro" },
] as const;

export const AGENTS = [
  { value: "webdev", label: "Web Developer" },
  { value: "syseng", label: "System Engineer" },
  { value: "analyst", label: "Data Analyst" },
  { value: "designer", label: "UX Designer" },
] as const;

export const FREE_TIER_LIMIT = 10; 