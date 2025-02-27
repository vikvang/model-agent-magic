// DIRECT CONSOLE LOG FOR DEBUGGING - THIS SHOULD APPEAR IMMEDIATELY
console.log("🟢🟢🟢 GREGIFY CONTENT SCRIPT LOADED 🟢🟢🟢");

// Use alert to make sure we're seen
alert("GREGIFY CONTENT SCRIPT LOADED!");

// Create a visual indicator that's impossible to miss
const overlayElement = document.createElement("div");
overlayElement.style.position = "fixed";
overlayElement.style.top = "100px";
overlayElement.style.left = "0";
overlayElement.style.width = "100%";
overlayElement.style.height = "50px";
overlayElement.style.backgroundColor = "blue";
overlayElement.style.color = "white";
overlayElement.style.fontSize = "24px";
overlayElement.style.padding = "10px";
overlayElement.style.zIndex = "999998";
overlayElement.style.textAlign = "center";
overlayElement.textContent = "GREGIFY CONTENT SCRIPT ACTIVE";
document.body.appendChild(overlayElement);

// Set a global variable so the debug script can detect us
(window as any).gregifyContentScriptLoaded = true;

// Try to alert to make it more visible if console logs aren't showing
try {
  const scriptLoaded =
    "GREGIFY: Content script loaded at " + new Date().toISOString();
  console.log(scriptLoaded);
  // Store in localStorage for debugging
  localStorage.setItem("gregify_debug", scriptLoaded);
  localStorage.setItem(
    "gregify_content_script",
    "YES - " + new Date().toISOString()
  );
} catch (e) {
  console.error("Error with debug logging:", e);
  alert("Error with debug logging: " + e);
}

// Check if debug script is loaded
function checkDebugScriptLoaded() {
  if ((window as any).gregifyDebugScriptLoaded) {
    console.log("✅ Debug script detected!");
    return true;
  }
  return false;
}

// Custom logger that also sends to debug script log if available
function logToDebug(message: string, type: "log" | "error" | "warn" = "log") {
  const prefix = "GREGIFY-CS: ";

  // Log to console
  if (type === "error") {
    console.error(prefix + message);
  } else if (type === "warn") {
    console.warn(prefix + message);
  } else {
    console.log(prefix + message);
  }

  // Try to append to debug log element if it exists
  try {
    const debugLogElement = document.querySelector(".gregify-debug-log");
    if (debugLogElement) {
      const time = new Date().toISOString().substring(11, 19);
      const logItem = document.createElement("div");
      logItem.innerHTML = `[${time}] <span class="gregify-${type}">${message}</span>`;
      debugLogElement.appendChild(logItem);
      // Scroll to bottom
      debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
  } catch (e) {
    // Silent fail - no need to log this error
  }
}

// Function to inject text into ChatGPT's textarea
function injectPrompt(prompt: string): boolean {
  logToDebug("injectPrompt called with: " + prompt.substring(0, 20) + "...");
  try {
    // Expanded selector to catch more potential matches, including user's specific selector
    const textarea = document.querySelector(
      '#prompt-textarea > p, #prompt-textarea, textarea[data-id="prompt-textarea"], textarea[data-id="root"], div[contenteditable="true"][id="prompt-textarea"], textarea, div[contenteditable="true"], [role="textbox"], .chat-pg-box textarea, .ProseMirror p, [data-slate-editor], #prompt-textarea > div, [data-lexical-editor]'
    ) as HTMLTextAreaElement | HTMLDivElement | HTMLParagraphElement;

    if (!textarea) {
      logToDebug("Could not find ChatGPT textarea", "error");
      // Try deep search
      const allElements = document.querySelectorAll("*");
      let foundElement = null;

      // Looking for potential input elements
      for (let i = 0; i < allElements.length && !foundElement; i++) {
        const el = allElements[i];
        if (
          ["SCRIPT", "STYLE", "META", "LINK", "BR", "HR"].includes(el.tagName)
        ) {
          continue;
        }

        if (
          el.getAttribute("contenteditable") === "true" ||
          el.getAttribute("role") === "textbox" ||
          el.getAttribute("data-id") === "prompt-textarea" ||
          el.id === "prompt-textarea" ||
          (el.tagName === "DIV" && el.getAttribute("tabindex") === "0") ||
          el.matches('div[data-content-editable-leaf="true"]')
        ) {
          foundElement = el;
          break;
        }
      }

      if (foundElement) {
        logToDebug(
          `Found input element via deep search: ${foundElement.tagName}`
        );
        return injectToElement(foundElement as HTMLElement, prompt);
      }

      // If still not found, log debug info
      const allTextareas = document.querySelectorAll("textarea");
      const allContentEditables = document.querySelectorAll(
        'div[contenteditable="true"]'
      );
      logToDebug(
        `Found ${allTextareas.length} textareas and ${allContentEditables.length} contenteditable divs`
      );
      return false;
    }

    logToDebug(`ChatGPT input found! Type: ${textarea.tagName}`);
    return injectToElement(textarea, prompt);
  } catch (error) {
    logToDebug("Error injecting prompt: " + (error as Error).message, "error");
    return false;
  }
}

// Helper function to inject text into different element types
function injectToElement(element: HTMLElement, text: string): boolean {
  try {
    if (element instanceof HTMLTextAreaElement) {
      // Set value for textarea
      element.value = text;
      element.style.height = "auto";
      element.style.height = element.scrollHeight + "px";
      logToDebug("Set value on HTMLTextAreaElement");
    } else if (
      element.getAttribute("contenteditable") === "true" ||
      element instanceof HTMLParagraphElement
    ) {
      // Handle contenteditable divs or paragraphs
      element.textContent = text;
      logToDebug(`Set textContent on ${element.tagName}`);
    } else {
      // For any other element type
      if ("value" in element) {
        // Use type assertion for elements that might have a value property
        (element as HTMLInputElement).value = text;
        logToDebug("Set value on element with value property");
      } else {
        element.textContent = text;
        logToDebug("Set textContent on generic element");
      }
    }

    // Create and dispatch input event
    const inputEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);

    // Create and dispatch change event
    const changeEvent = new Event("change", {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(changeEvent);

    logToDebug("Dispatched input and change events");

    // Focus the element
    element.focus();

    // Try to find and click the submit button
    const submitButton = document.querySelector(
      'button[data-testid="send-button"], button[class*="absolute p-1"], button[aria-label="Send message"], button.send-button'
    ) as HTMLButtonElement;

    if (submitButton) {
      logToDebug("Found submit button, clicking it");
      submitButton.click();
      return true;
    } else {
      logToDebug("Submit button not found", "warn");
      return true; // Still return true since we injected the text
    }
  } catch (error) {
    logToDebug(
      `Error in injectToElement: ${(error as Error).message}`,
      "error"
    );
    return false;
  }
}

// Variables for debounce timer and typing detection
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let suggestionContainer: HTMLDivElement | null = null;
let lastInput = "";
let suggestionActive = false;
let currentSuggestion = "";
let textareaElement: HTMLTextAreaElement | HTMLDivElement | null = null;

// Function to create suggestion UI
function createSuggestionUI() {
  // Create the suggestion container if it doesn't exist
  if (!suggestionContainer) {
    logToDebug("Creating suggestion container");
    suggestionContainer = document.createElement("div");
    suggestionContainer.className = "gregify-suggestion-container";
    suggestionContainer.style.position = "absolute";
    suggestionContainer.style.zIndex = "1000";
    suggestionContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    suggestionContainer.style.color = "#aaa";
    suggestionContainer.style.borderRadius = "4px";
    suggestionContainer.style.padding = "8px 12px";
    suggestionContainer.style.fontSize = "14px";
    suggestionContainer.style.display = "none";
    suggestionContainer.style.maxWidth = "90%";
    suggestionContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    suggestionContainer.style.backdropFilter = "blur(5px)";
    document.body.appendChild(suggestionContainer);
    logToDebug("Suggestion container added to DOM");
  }
  return suggestionContainer;
}

// Function to position the suggestion container
function positionSuggestionContainer() {
  if (!textareaElement || !suggestionContainer) {
    logToDebug(
      "Cannot position suggestion container - missing elements",
      "warn"
    );
    return;
  }

  const rect = textareaElement.getBoundingClientRect();
  logToDebug(`Textarea position: ${rect.top}, ${rect.left}`);

  const lineHeight = 22; // Approximate line height

  // Calculate cursor position
  let cursorText = "";
  if (textareaElement instanceof HTMLTextAreaElement) {
    cursorText = textareaElement.value.substring(
      0,
      textareaElement.selectionEnd || 0
    );
  } else {
    // For contenteditable, this is a simplification
    cursorText = textareaElement.textContent || "";
  }

  const lines = cursorText.split("\n");
  const currentLine = lines.length;
  logToDebug(`Cursor at line ${currentLine} of text`);

  suggestionContainer.style.top = `${
    rect.top + currentLine * lineHeight + 5
  }px`;
  suggestionContainer.style.left = `${rect.left + 10}px`;
  logToDebug(
    `Positioned suggestion container at: ${suggestionContainer.style.top}, ${suggestionContainer.style.left}`
  );
}

// Function to get suggestions using the fast-prompt API
async function getSuggestions(input: string): Promise<string> {
  if (!input.trim()) return "";

  logToDebug(`Getting suggestions for input: ${input.substring(0, 20)}...`);

  try {
    // Send a message to the background script to make the API call
    logToDebug("Sending message to background script");
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "getAutocompleteSuggestion",
          prompt: input,
        },
        (response) => {
          logToDebug(
            `Received response from background script: ${JSON.stringify(
              response
            ).substring(0, 50)}...`
          );
          if (response && response.success && response.suggestion) {
            logToDebug(
              `Got valid suggestion: ${response.suggestion.substring(0, 30)}...`
            );
            resolve(response.suggestion);
          } else {
            logToDebug("No valid suggestion in response", "warn");
            resolve("");
          }
        }
      );
    });
  } catch (error) {
    logToDebug(
      `Error getting suggestions: ${(error as Error).message}`,
      "error"
    );
    return "";
  }
}

// Function to handle input events on the textarea
function handleInput(event: Event) {
  logToDebug(`Input event detected: ${event.type}`);

  if (!event.target) {
    logToDebug("No event target found", "warn");
    return;
  }

  textareaElement = event.target as HTMLTextAreaElement | HTMLDivElement;
  logToDebug(`Textarea element found: ${textareaElement.tagName}`);

  let input = "";
  if (textareaElement instanceof HTMLTextAreaElement) {
    input = textareaElement.value;
    logToDebug(`Input from HTMLTextAreaElement: ${input.substring(0, 20)}...`);
  } else {
    input = textareaElement.textContent || "";
    logToDebug(`Input from contenteditable div: ${input.substring(0, 20)}...`);
  }

  // If the input is the same as last time, don't do anything
  if (input === lastInput) {
    logToDebug("Input unchanged, skipping");
    return;
  }

  logToDebug(`New input detected: ${input.substring(0, 20)}...`);
  lastInput = input;

  // Clear any existing debounce timer
  if (debounceTimer) {
    logToDebug("Clearing existing debounce timer");
    clearTimeout(debounceTimer);
  }

  // Set a new debounce timer
  logToDebug("Setting new debounce timer (500ms)");
  debounceTimer = setTimeout(async () => {
    logToDebug("Debounce timer expired, processing input");

    // Only get suggestions if the input is not empty
    if (input.trim()) {
      logToDebug("Input not empty, getting suggestions");
      const suggestion = await getSuggestions(input);

      if (suggestion && suggestion !== input) {
        logToDebug(
          `Valid suggestion received: ${suggestion.substring(0, 30)}...`
        );
        currentSuggestion = suggestion;
        suggestionActive = true;

        // Create and position the suggestion UI
        const container = createSuggestionUI();
        positionSuggestionContainer();

        // Display the suggestion
        container.textContent = suggestion;
        container.style.display = "block";
        logToDebug("Showing suggestion");
      } else {
        // Hide the suggestion UI if no valid suggestion
        if (suggestionContainer) {
          suggestionContainer.style.display = "none";
          logToDebug("No valid suggestion, hiding suggestion UI");
        }
        suggestionActive = false;
      }
    } else {
      // Hide the suggestion UI if input is empty
      if (suggestionContainer) {
        suggestionContainer.style.display = "none";
        logToDebug("Input empty, hiding suggestion UI");
      }
      suggestionActive = false;
    }
  }, 500);
}

// Function to handle keydown events for accepting suggestions
function handleKeyDown(event: KeyboardEvent) {
  logToDebug(`Key pressed: ${event.key}`);

  if (event.key === "Tab" && suggestionActive && currentSuggestion) {
    logToDebug("Tab key pressed with active suggestion, accepting suggestion");
    event.preventDefault();

    // Apply the suggestion
    if (textareaElement) {
      logToDebug(
        `Applying suggestion: ${currentSuggestion.substring(0, 30)}...`
      );

      if (textareaElement instanceof HTMLTextAreaElement) {
        textareaElement.value = currentSuggestion;
      } else {
        textareaElement.textContent = currentSuggestion;
      }

      // Dispatch input and change events
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
      });

      const changeEvent = new Event("change", {
        bubbles: true,
        cancelable: true,
      });

      textareaElement.dispatchEvent(inputEvent);
      textareaElement.dispatchEvent(changeEvent);
      logToDebug("Dispatched input and change events");

      // Hide the suggestion container
      if (suggestionContainer) {
        suggestionContainer.style.display = "none";
        logToDebug("Hidden suggestion container");
      }

      suggestionActive = false;
      lastInput = currentSuggestion;
    }
  }
}

// Function to find and attach event listeners to ChatGPT textarea
function findAndAttachListeners() {
  logToDebug("Finding ChatGPT textarea and attaching listeners");

  // Try various selectors for the ChatGPT textarea
  const selectors = [
    'textarea[data-id="prompt-textarea"]',
    'div[contenteditable="true"][id="prompt-textarea"]',
    'textarea[placeholder*="Send a message"]',
    'div[contenteditable="true"]',
    "textarea",
    '[role="textbox"]',
    ".chat-pg-box textarea",
  ];

  // Try each selector until we find a match
  for (const selector of selectors) {
    const textarea = document.querySelector(selector);
    if (textarea) {
      logToDebug(`Found textarea with selector: ${selector}`);
      // Only add event listeners if we haven't already
      if (textarea !== textareaElement) {
        textareaElement = textarea as HTMLTextAreaElement | HTMLDivElement;

        // Add input event listener
        textarea.addEventListener("input", handleInput);
        logToDebug("Added input event listener");

        // Add keydown event listener for accepting suggestions with Tab
        textarea.addEventListener("keydown", handleKeyDown);
        logToDebug("Added keydown event listener");

        return true;
      } else {
        logToDebug("Textarea already has listeners attached");
        return true;
      }
    }
  }

  logToDebug("Could not find ChatGPT textarea with any selector", "warn");
  return false;
}

// Initialize event listeners when DOM is ready
function initializeListeners() {
  logToDebug("Initializing event listeners");

  // Try to find and attach listeners immediately
  if (!findAndAttachListeners()) {
    logToDebug(
      "Initial attempt to find textarea failed, setting up MutationObserver"
    );

    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      if (!textareaElement) {
        logToDebug("DOM mutation observed, trying to find textarea again");
        findAndAttachListeners();
      }
    });

    // Observe the body for childList and subtree changes
    observer.observe(document.body, { childList: true, subtree: true });
    logToDebug("MutationObserver started");
  }
}

// Call the initialize function when the content script loads
logToDebug("Content script initialization starting");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeListeners);
  logToDebug("Added DOMContentLoaded event listener");
} else {
  // If the document is already loaded, call the initialize function immediately
  initializeListeners();
  logToDebug("Document already loaded, initializing listeners immediately");
}

// Check for debug script every 500ms until found
let debugCheckInterval = setInterval(() => {
  if (checkDebugScriptLoaded()) {
    logToDebug("Debug script detected!");
    clearInterval(debugCheckInterval);
  }
}, 500);

// Tell background script we are active
chrome.runtime.sendMessage(
  { action: "contentScriptLoaded", url: window.location.href },
  (response) => {
    logToDebug(
      `Background script response: ${
        response ? JSON.stringify(response) : "none"
      }`
    );
  }
);

logToDebug("Content script initialization complete");

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📬 Content script received message:", request);
  if (request.action === "injectPrompt") {
    const success = injectPrompt(request.prompt);
    console.log("💉 Injection result:", success);
    sendResponse({ success });
  }
  return true; // Required for async response
});
