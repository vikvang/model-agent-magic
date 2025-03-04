// Background script for the extension
console.log("Gregify background script loaded");

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);

  // When enhancedPromptReady is received, forward it to the active tab
  if (message.action === "enhancedPromptReady") {
    // Save to storage for state persistence
    chrome.storage.local.set({ gregify_last_prompt: message.enhancedPrompt });

    // Forward to active tab
    forwardToActiveTab(message.enhancedPrompt);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

/**
 * Forwards the enhanced prompt to the active tab
 */
async function forwardToActiveTab(enhancedPrompt: string) {
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      console.error("No active tab found");
      return;
    }

    const activeTab = tabs[0];

    // Make sure we're on ChatGPT
    if (!activeTab.url?.includes("chat.openai.com")) {
      console.log("Not on ChatGPT, not forwarding prompt");
      return;
    }

    try {
      // Send message to content script
      await chrome.tabs.sendMessage(activeTab.id!, {
        action: "populatePrompt",
        enhancedPrompt,
      });
    } catch (error) {
      console.error("Error sending message to tab:", error);

      // Fallback: inject script directly
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id! },
        func: (prompt: string) => {
          const textarea = document.querySelector(
            "#prompt-textarea"
          ) as HTMLTextAreaElement;
          if (textarea) {
            textarea.value = prompt;

            // Trigger input event
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.focus();
          }
        },
        args: [enhancedPrompt],
      });
    }
  } catch (error) {
    console.error("Error in forwardToActiveTab:", error);
  }
}
