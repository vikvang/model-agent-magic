// Background script for the extension
console.log("Gregify background script loaded");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);

  if (message.action === "enhancedPromptReady") {
    // Forward the enhanced prompt to the active tab (ChatGPT)
    forwardToActiveTab(message.enhancedPrompt);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

/**
 * Forwards the enhanced prompt to the active tab
 * @param {string} enhancedPrompt The enhanced prompt to forward
 */
async function forwardToActiveTab(enhancedPrompt) {
  try {
    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      console.error("No active tab found");
      return;
    }

    const activeTab = tabs[0];

    // Allow any website, not just ChatGPT
    // Send the enhanced prompt to the content script
    await chrome.tabs.sendMessage(activeTab.id, {
      action: "populatePrompt",
      enhancedPrompt,
    });

    console.log("Enhanced prompt forwarded to content script");
  } catch (error) {
    console.error("Error forwarding enhanced prompt:", error);
  }
}
