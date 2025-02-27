// Simple background script without any external dependencies
console.log("Simple background script loaded");

// Generate a random session ID
const sessionId = Math.random().toString(36).substring(2, 15);

// API configuration
const API_URL = "http://localhost:8000";

// Function to get autocomplete suggestions
async function getAutocompleteSuggestion(prompt) {
  console.log(
    "Getting autocomplete suggestion for:",
    prompt.substring(0, 30) + "..."
  );

  try {
    // First try to use local fast-prompt API
    const response = await fetch(`${API_URL}/fast-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionId,
        prompt: prompt,
        model: "gpt-3.5-turbo", // Using faster model for quick suggestions
        role: "webdev", // Default role
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    if (data.success && data.improved_prompt) {
      return {
        success: true,
        suggestion: data.improved_prompt,
      };
    } else {
      // Fallback to a simple completion if the API fails
      return {
        success: true,
        suggestion: prompt + " [API couldn't generate a suggestion]",
      };
    }
  } catch (error) {
    console.error("Error getting suggestion:", error);

    // Provide fallback when API is unavailable
    return {
      success: true,
      suggestion: prompt + " [could not connect to suggestion API]",
    };
  }
}

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request.action);

  if (request.action === "injectPrompt") {
    // Forward the message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "injectPrompt",
          prompt: request.prompt,
        },
        function (response) {
          // Forward the response from the content script to the popup
          sendResponse(
            response || {
              success: false,
              error: "No response from content script",
            }
          );
        }
      );
    });

    // Return true to indicate async response
    return true;
  }

  if (request.action === "getDebugInfo") {
    // Forward debug request to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        sendResponse({ error: "No active tab found" });
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "getDebugInfo",
        },
        function (response) {
          sendResponse(
            response || { error: "No response from content script" }
          );
        }
      );
    });

    // Return true to indicate async response
    return true;
  }

  if (request.action === "getAutocompleteSuggestion") {
    // Get ghost text suggestions
    getAutocompleteSuggestion(request.prompt).then((result) => {
      console.log(
        "Sending suggestion back to content script:",
        result.suggestion
          ? result.suggestion.substring(0, 30) + "..."
          : "No suggestion"
      );
      sendResponse(result);
    });

    // Return true to indicate async response
    return true;
  }
});
