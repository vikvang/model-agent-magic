// Content script for interacting with ChatGPT
console.log("%c 🚀 GREGIFY CONTENT SCRIPT LOADED 🚀", "background: #FF6B4A; color: white; font-size: 14px; padding: 5px; border-radius: 5px;");

// Check if we're on the right page and log more info
if (window.location.href.includes("chat.openai.com")) {
  console.log("%c GREGIFY ACTIVE ON CHATGPT", "background: #4CAF50; color: white; font-size: 12px; padding: 3px;");
  console.log("Page URL:", window.location.href);
  console.log("Gregify extension ID:", chrome.runtime.id);
  
  // Create a small element to indicate extension is active
  const indicator = document.createElement("div");
  indicator.textContent = "Gregify Active";
  indicator.style.cssText = "position: fixed; bottom: 10px; right: 10px; background: #FF6B4A; color: white; padding: 5px 10px; border-radius: 5px; z-index: 10000; font-size: 12px;";
  document.body.appendChild(indicator);
  
  // Remove the indicator after 5 seconds
  setTimeout(() => {
    if (document.body.contains(indicator)) {
      document.body.removeChild(indicator);
    }
  }, 5000);
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("%c Message received in content script:", "background: #2196F3; color: white;", message);

  if (message.action === "populatePrompt" && message.enhancedPrompt) {
    populateChatGPTTextarea(message.enhancedPrompt);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

/**
 * Populates the ChatGPT textarea with the enhanced prompt
 * @param {string} enhancedPrompt The enhanced prompt to populate
 */
function populateChatGPTTextarea(enhancedPrompt) {
  try {
    console.log(
      "%c Populating ChatGPT textarea with:",
      "background: #9C27B0; color: white;",
      enhancedPrompt
    );

    // Find the textarea element using the specific selector provided
    const textarea = document.querySelector("#prompt-textarea");
    const textareaContent = document.querySelector("#prompt-textarea > p");

    if (!textarea) {
      console.error("%c ChatGPT textarea not found", "background: #F44336; color: white;");
      return;
    }

    // If the textarea has a p element child (as per the selector provided), set its content
    if (textareaContent) {
      console.log("%c Found textarea content element, setting innerHTML", "background: #4CAF50; color: white;");
      textareaContent.innerHTML = enhancedPrompt;
    } else {
      // Otherwise, set the value of the textarea directly
      console.log("%c Setting textarea value directly", "background: #4CAF50; color: white;");
      textarea.value = enhancedPrompt;
    }

    // Create and dispatch an input event to trigger ChatGPT's internal handlers
    const inputEvent = new Event("input", { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    // Focus the textarea
    textarea.focus();

    console.log("%c Successfully populated ChatGPT textarea", "background: #4CAF50; color: white; font-weight: bold;");
  } catch (error) {
    console.error("%c Error populating ChatGPT textarea:", "background: #F44336; color: white;", error);
  }
}