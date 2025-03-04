/**
 * Configuration for the Gregify Chrome extension
 *
 * This file provides environment-specific configuration for the extension.
 * In development, it uses localhost. In production, it uses EC2 public IP.
 */

// Force production mode for the extension
// This ensures we always use the EC2 backend when the extension is loaded in Chrome
const isProduction = true;

// Default model for prompt optimization based on user preference
// This is separate from the AI provider setting
const getDefaultModel = () => {
  // We still use a reasonable default based on provider
  const preferredProvider =
    localStorage.getItem("gregify_ai_provider") || "deepseek";
  // But this is just for a better initial experience - they are decoupled
  return preferredProvider === "openai" ? "gpt4" : "deepseek";
};

// Base configuration
const config = {
  // API endpoints
  api: {
    // Base API URL - this should be updated when deployed
    baseUrl: isProduction
      ? "http://3.144.207.70" // EC2 public IP
      : "http://localhost:8000",

    // API endpoints
    endpoints: {
      normalPrompt: "/normal-prompt",
      processPrompt: "/process-prompt",
      health: "/health",
      login: "/auth/token",
      register: "/auth/register",
      userInfo: "/auth/me",
    },
  },

  // Supabase configuration (if using Supabase directly from frontend)
  supabase: {
    url: isProduction
      ? "https://your-project-id.supabase.co" // Replace with your Supabase URL
      : "http://localhost:54321", // Local Supabase URL
    key: "your-supabase-anon-key", // Replace with your public anon key
  },

  // Extension settings
  settings: {
    defaultRole: "webdev",
    defaultModel: getDefaultModel(),
    availableRoles: ["webdev", "syseng", "analyst", "designer"],
    useMultiAgent: true,
    promptHistory: {
      enabled: true,
      maxItems: 10,
    },
  },

  // Storage keys
  storage: {
    sessionId: "gregify_session_id",
    authToken: "gregify_auth_token",
    userProfile: "gregify_user_profile",
    promptHistory: "gregify_prompt_history",
    settings: "gregify_settings",
    aiProvider: "gregify_ai_provider",
  },
};

export default config;
