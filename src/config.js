/**
 * Configuration for the Gregify Chrome extension
 *
 * This file provides environment-specific configuration for the extension.
 * In development, it uses localhost. In production, it uses Railway.
 */

// Determine if we're in production mode
const isProduction = !window.location.href.includes("localhost");

// Check preferred AI provider
const getDefaultModel = () => {
  const preferredProvider = localStorage.getItem("gregify_ai_provider") || "deepseek";
  return preferredProvider === "openai" ? "gpt4o-mini" : "deepseek";
};

// Base configuration
const config = {
  // API endpoints
  api: {
    // Base API URL - this should be updated when deployed
    baseUrl: isProduction
      ? "https://gregify-production.up.railway.app" // Replace with your Railway URL
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
    aiProvider: "gregify_ai_provider"
  },
};

export default config;
