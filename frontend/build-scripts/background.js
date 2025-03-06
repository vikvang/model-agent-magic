// Background script for the extension
console.log("%c 🚀 GREGIFY BACKGROUND SCRIPT LOADED 🚀", "background: #FF6B4A; color: white; font-size: 14px; padding: 5px; border-radius: 5px;");

// Log extension details
console.log("Extension ID:", chrome.runtime.id);
console.log("Extension Version:", chrome.runtime.getManifest().version);
console.log("Extension Name:", chrome.runtime.getManifest().name);

// Listen for install event
chrome.runtime.onInstalled.addListener((details) => {
  console.log("%c GREGIFY EXTENSION INSTALLED/UPDATED", "background: #4CAF50; color: white; font-size: 12px; padding: 3px;");
  console.log("Reason:", details.reason);
  console.log("Previous Version:", details.previousVersion);
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("%c Message received in background:", "background: #2196F3; color: white;", message);

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
      console.error("%c No active tab found", "background: #F44336; color: white;");
      return;
    }

    const activeTab = tabs[0];

    console.log("%c Sending to active tab:", "background: #4CAF50; color: white;", activeTab.url);

    try {
      // Send the enhanced prompt to the content script
      await chrome.tabs.sendMessage(activeTab.id, {
        action: "populatePrompt",
        enhancedPrompt,
      });
      console.log("%c Enhanced prompt forwarded to content script", "background: #4CAF50; color: white;");
    } catch (err) {
      console.error("%c Error sending message to tab:", "background: #F44336; color: white;", err);

      // As a fallback, try to execute script directly in the page
      if (activeTab.url && activeTab.url.includes("chat.openai.com")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: injectAndPopulate,
            args: [enhancedPrompt],
          });
          console.log("%c Used fallback script injection", "background: #FF9800; color: white;");
        } catch (scriptErr) {
          console.error("%c Fallback script injection also failed:", "background: #F44336; color: white;", scriptErr);
        }
      }
    }
  } catch (error) {
    console.error("%c Error in forwardToActiveTab:", "background: #F44336; color: white;", error);
  }
}

// Function to be injected directly into the page as a fallback
function injectAndPopulate(prompt) {
  console.log("%c Direct script injection to populate textarea", "background: #FF9800; color: white;");

  const textarea = document.querySelector("#prompt-textarea");
  const textareaContent = document.querySelector("#prompt-textarea > p");

  if (!textarea) {
    console.error("%c ChatGPT textarea not found", "background: #F44336; color: white;");
    return;
  }

  if (textareaContent) {
    textareaContent.innerHTML = prompt;
  } else {
    textarea.value = prompt;
  }

  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);
  textarea.focus();
}