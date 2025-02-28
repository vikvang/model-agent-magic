// Script to prepare extension files for build
import fs from "fs";

interface Manifest {
  name?: string;
  description?: string;
  version?: string;
  icons?: {
    [key: string]: string;
  };
  manifest_version?: number;
  action?: {
    default_popup?: string;
    default_width?: number;
    default_height?: number;
  };
  permissions?: string[];
  content_security_policy?: {
    extension_pages?: string;
  };
  background?: {
    service_worker?: string;
    type?: string;
  };
  content_scripts?: Array<{
    matches: string[];
    js: string[];
    run_at?: string;
  }>;
  web_accessible_resources?: Array<{
    resources: string[];
    matches: string[];
  }>;
  host_permissions?: string[];
}

// Read the current manifest in the dist folder (if it exists)
let distManifest: Manifest = {};
try {
  if (fs.existsSync("./dist/manifest.json")) {
    distManifest = JSON.parse(fs.readFileSync("./dist/manifest.json", "utf8"));
    console.log("Read existing dist manifest");
  }
} catch (error) {
  console.error("Error reading dist manifest:", error);
}

// Create our enhanced manifest
const enhancedManifest: Manifest = {
  ...distManifest, // Keep existing properties
  manifest_version: 3,
  name: distManifest.name || "Gregify",
  description:
    distManifest.description ||
    "AI-powered prompt enhancement using RAG and Multi-Agent Systems",
  version: distManifest.version || "1.0",
  action: {
    default_popup: "index.html",
    default_width: 400,
    default_height: 600,
  },
  permissions: ["tabs", "activeTab", "scripting"],
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:*",
  },
  background: {
    service_worker: "background.js",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://chat.openai.com/*", "https://chatgpt.com/*"],
      js: ["contentScript.js"],
      run_at: "document_idle",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["contentScript.js"],
      matches: ["https://chat.openai.com/*", "https://chatgpt.com/*"],
    },
  ],
  host_permissions: ["http://localhost:8000/*", "http://localhost:5678/*"],

  // Keep existing icons if present
  icons: distManifest.icons || {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
};

// Write the enhanced manifest to the root directory for the build process
fs.writeFileSync("./manifest.json", JSON.stringify(enhancedManifest, null, 2));
console.log("Created enhanced manifest.json in root directory");

// Ensure contentScript.js and background.js exist
const contentScript = `// Content script for interacting with ChatGPT
console.log("Gregify content script loaded");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);

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
      "Attempting to populate ChatGPT textarea with:",
      enhancedPrompt
    );

    // Find the textarea element using the specific selector provided
    const textarea = document.querySelector("#prompt-textarea");
    const textareaContent = document.querySelector("#prompt-textarea > p");

    if (!textarea) {
      console.error("ChatGPT textarea not found");
      return;
    }

    // If the textarea has a p element child (as per the selector provided), set its content
    if (textareaContent) {
      console.log("Found textarea content element, setting innerHTML");
      textareaContent.innerHTML = enhancedPrompt;
    } else {
      // Otherwise, set the value of the textarea directly
      console.log("Setting textarea value directly");
      textarea.value = enhancedPrompt;
    }

    // Create and dispatch an input event to trigger ChatGPT's internal handlers
    const inputEvent = new Event("input", { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    // Focus the textarea
    textarea.focus();

    console.log("Successfully populated ChatGPT textarea");
  } catch (error) {
    console.error("Error populating ChatGPT textarea:", error);
  }
}`;

const backgroundScript = `// Background script for the extension
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

    console.log("Sending to active tab:", activeTab.url);

    try {
      // Send the enhanced prompt to the content script
      await chrome.tabs.sendMessage(activeTab.id, {
        action: "populatePrompt",
        enhancedPrompt,
      });
      console.log("Enhanced prompt forwarded to content script");
    } catch (err) {
      console.error("Error sending message to tab:", err);

      // As a fallback, try to execute script directly in the page
      if (activeTab.url && activeTab.url.includes("chat.openai.com")) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: injectAndPopulate,
            args: [enhancedPrompt],
          });
          console.log("Used fallback script injection");
        } catch (scriptErr) {
          console.error("Fallback script injection also failed:", scriptErr);
        }
      }
    }
  } catch (error) {
    console.error("Error in forwardToActiveTab:", error);
  }
}

// Function to be injected directly into the page as a fallback
function injectAndPopulate(prompt) {
  console.log("Direct script injection to populate textarea");

  const textarea = document.querySelector("#prompt-textarea");
  const textareaContent = document.querySelector("#prompt-textarea > p");

  if (!textarea) {
    console.error("ChatGPT textarea not found");
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
}`;

// Write the content and background scripts to the root directory
fs.writeFileSync("./contentScript.js", contentScript);
fs.writeFileSync("./background.js", backgroundScript);

console.log("Created contentScript.js and background.js in root directory");
console.log(
  'Extension files are ready for build. Run "npm run build" to create the extension.'
);
