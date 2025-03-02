// Script to prepare extension files for build
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting build extension script...");

// First check if there's a manifest in the root directory
let rootManifest = {};
try {
  const rootManifestPath = path.join(__dirname, "manifest.json");
  if (fs.existsSync(rootManifestPath)) {
    rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, "utf8"));
    console.log("Read existing root manifest");
  }
} catch (error) {
  console.error("Error reading root manifest:", error);
}

// Read the current manifest in the dist folder (if it exists)
let distManifest = {};
try {
  const distManifestPath = path.join(__dirname, "dist", "manifest.json");
  if (fs.existsSync(distManifestPath)) {
    distManifest = JSON.parse(fs.readFileSync(distManifestPath, "utf8"));
    console.log("Read existing dist manifest");
  }
} catch (error) {
  console.error("Error reading dist manifest:", error);
}

// Create our enhanced manifest
const enhancedManifest = {
  ...distManifest, // Keep existing properties
  manifest_version: 3,
  name: rootManifest.name || distManifest.name || "Gregify",
  description:
    rootManifest.description ||
    distManifest.description ||
    "AI-powered prompt enhancement using RAG and Multi-Agent Systems",
  version: rootManifest.version || distManifest.version || "1.0",
  action: {
    default_popup: "index.html",
    default_width: 400,
    default_height: 600,
  },
  permissions: ["tabs", "activeTab", "scripting"],
  
  // Use existing CSP if available in root manifest, otherwise use default
  content_security_policy: rootManifest.content_security_policy || {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* https://xfcuhjsxodypspldaorz.supabase.co/* https://*",
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
  icons: rootManifest.icons || distManifest.icons || {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
};

// Ensure root directory exists
const rootDir = __dirname;
console.log("Root directory:", rootDir);

// Write the enhanced manifest to the root directory for the build process
fs.writeFileSync(
  path.join(rootDir, "manifest.json"),
  JSON.stringify(enhancedManifest, null, 2)
);
console.log("Created enhanced manifest.json in root directory");

// Ensure contentScript.js and background.js exist
const contentScript = `// Content script for interacting with ChatGPT
console.log("%c 🚀 GREGIFY CONTENT SCRIPT LOADED 🚀", "background: #FF6B4A; color: white; font-size: 14px; padding: 5px; border-radius: 5px;");

// Create and insert CSS styles for notifications
const styleElement = document.createElement('style');
styleElement.textContent = \`
  .gregify-notification {
    position: fixed;
    z-index: 10000;
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  }
  
  .gregify-notification.success {
    background: #FF6B4A;
    color: white;
    border-left: 4px solid #e55d3d;
  }
  
  .gregify-notification.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .gregify-notification-icon {
    margin-right: 8px;
    font-size: 20px;
  }
  
  .gregify-notification-close {
    margin-left: 10px;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.7;
  }
  
  .gregify-notification-close:hover {
    opacity: 1;
  }
  
  @keyframes gregify-progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  .gregify-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.7);
    animation: gregify-progress 5s linear forwards;
  }
\`;
document.head.appendChild(styleElement);

// Function to show notification
function showNotification(message, type = 'success', duration = 5000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = \`gregify-notification \${type}\`;
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  
  // Add content
  notification.innerHTML = \`
    <div class="gregify-notification-icon">✨</div>
    <div class="gregify-notification-content">\${message}</div>
    <div class="gregify-notification-close">×</div>
    <div class="gregify-progress-bar"></div>
  \`;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Handle close button
  const closeBtn = notification.querySelector('.gregify-notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  });
  
  // Auto remove after duration
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
  
  return notification;
}

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
      showNotification("Error: Could not find ChatGPT textarea", "error");
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

    // Get the first 30 characters of the prompt for the notification
    const promptPreview = enhancedPrompt.length > 30 
      ? enhancedPrompt.substring(0, 30) + "..." 
      : enhancedPrompt;
    
    // Show success notification
    showNotification(\`Enhanced prompt inserted: "\${promptPreview}"\`, 'success');

    console.log("%c Successfully populated ChatGPT textarea", "background: #4CAF50; color: white; font-weight: bold;");
  } catch (error) {
    console.error("%c Error populating ChatGPT textarea:", "background: #F44336; color: white;", error);
    showNotification("Error populating ChatGPT textarea", "error");
  }
}`;

const backgroundScript = `// Background script for the extension
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
}`;

// Write the content and background scripts to the root directory
fs.writeFileSync(path.join(rootDir, "contentScript.js"), contentScript);
fs.writeFileSync(path.join(rootDir, "background.js"), backgroundScript);

console.log("Created contentScript.js and background.js in root directory");

// Create a post-build script to copy files to dist
const postBuildScript = `// Post-build script to copy extension files to dist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcFiles = [
  'contentScript.js',
  'background.js',
  'manifest.json'
];

// Copy each file to dist
srcFiles.forEach(file => {
  try {
    fs.copyFileSync(
      path.join(__dirname, file),
      path.join(__dirname, 'dist', file)
    );
    console.log(\`Copied \${file} to dist folder\`);
  } catch (error) {
    console.error(\`Error copying \${file} to dist:\`, error);
  }
});

console.log('Post-build file copying complete');
`;

// Write the post-build script
fs.writeFileSync(path.join(rootDir, "post-build.js"), postBuildScript);
console.log("Created post-build script");

console.log(
  'Extension files are ready for build. Run "npm run build" to create the extension.'
);
