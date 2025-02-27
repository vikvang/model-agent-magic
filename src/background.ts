import { AgentRole, ModelType } from "./types/agent";

// Configuration for the API
const API_URL = "http://localhost:8000";
const DEFAULT_MODEL: ModelType = "gpt4";
const DEFAULT_ROLE: AgentRole = "webdev";

console.log("🚀 Background script loaded with config:", {
  API_URL,
  DEFAULT_MODEL,
  DEFAULT_ROLE,
});

// Generate a session ID for this browser session
const sessionId = crypto.randomUUID();
console.log("🆔 Generated session ID:", sessionId);

// Function to get suggestions from the API
async function getSuggestion(
  prompt: string
): Promise<{ success: boolean; suggestion: string }> {
  console.log("🔍 getSuggestion called with prompt:", prompt);

  try {
    // Call the fast-prompt endpoint for quick suggestions
    console.log("📡 Making API request to:", `${API_URL}/fast-prompt`);
    console.log("📦 Request payload:", {
      sessionId,
      prompt,
      model: DEFAULT_MODEL,
      role: DEFAULT_ROLE,
    });

    const response = await fetch(`${API_URL}/fast-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sessionId,
        prompt,
        model: DEFAULT_MODEL,
        role: DEFAULT_ROLE,
      }),
    });

    console.log("📬 API response status:", response.status);

    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📄 API response data:", data);

    if (!data.success) {
      console.error("❌ API reported failure:", data.error);
      throw new Error(data.error || "Failed to get suggestion");
    }

    console.log("✅ Successfully got suggestion:", data.improved_prompt);
    return {
      success: true,
      suggestion: data.improved_prompt,
    };
  } catch (error) {
    console.error("❌ Error getting autocomplete suggestion:", error);
    return {
      success: false,
      suggestion: "",
    };
  }
}

// Setup message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📬 Background script received message:", request);
  console.log("👤 Message sender:", sender);

  if (request.action === "getAutocompleteSuggestion") {
    console.log("🎯 Processing getAutocompleteSuggestion request");

    // Get suggestion and send response asynchronously
    getSuggestion(request.prompt)
      .then((result) => {
        console.log("📤 Sending response back to content script:", result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error("❌ Error in background script:", error);
        console.log("📤 Sending error response to content script");
        sendResponse({ success: false, suggestion: "" });
      });

    console.log("⏳ Returning true to indicate async response");
    return true; // Required for async sendResponse
  }

  console.log("⚠️ No handler for message action:", request.action);
  return false;
});

// Log when the background script loads
console.log("✅ Gregify background script fully initialized");
