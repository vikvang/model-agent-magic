// Basic script with minimal dependencies
(function () {
  console.log("BASIC SCRIPT RUNNING - NO DEPENDENCIES");

  // Store debug info
  const debugInfo = {
    loadTime: new Date().toISOString(),
    elementsFound: {},
    lastAction: null,
    errors: [],
  };

  // Create a more elegant indicator
  const indicator = document.createElement("div");
  indicator.textContent = "Gregify";
  indicator.style.position = "fixed";
  indicator.style.bottom = "10px";
  indicator.style.left = "10px";
  indicator.style.backgroundColor = "rgba(86, 61, 124, 0.8)";
  indicator.style.color = "white";
  indicator.style.padding = "8px 12px";
  indicator.style.zIndex = "9999999";
  indicator.style.borderRadius = "20px";
  indicator.style.fontFamily = "Arial, sans-serif";
  indicator.style.fontSize = "14px";
  indicator.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  indicator.style.backdropFilter = "blur(5px)";
  indicator.style.display = "flex";
  indicator.style.alignItems = "center";
  indicator.style.gap = "10px";

  // Variables for ghost text functionality
  let debounceTimer = null;
  let suggestionContainer = null;
  let lastInput = "";
  let suggestionActive = false;
  let currentSuggestion = "";
  let textareaElement = null;

  // Track if we've already attached listeners to avoid duplicates
  let listenersAttached = false;

  // Wait for DOM to be fully loaded
  function init() {
    // Only add the indicator if not already present
    if (!document.querySelector(".gregify-indicator")) {
      indicator.className = "gregify-indicator";
      document.body.appendChild(indicator);

      // Container for controls
      const controlsContainer = document.createElement("div");
      controlsContainer.style.display = "flex";
      controlsContainer.style.alignItems = "center";
      controlsContainer.style.gap = "8px";
      indicator.appendChild(controlsContainer);

      // Add button to inject text
      const injectButton = document.createElement("button");
      injectButton.textContent = "Test";
      injectButton.style.background = "white";
      injectButton.style.color = "#563d7c";
      injectButton.style.border = "none";
      injectButton.style.padding = "4px 8px";
      injectButton.style.borderRadius = "12px";
      injectButton.style.cursor = "pointer";
      injectButton.style.fontSize = "12px";
      injectButton.style.fontWeight = "bold";

      injectButton.onclick = function () {
        injectTextToInput("This is a test message from Gregify");
      };

      controlsContainer.appendChild(injectButton);

      // Add ghost text toggle
      const ghostTextToggle = document.createElement("div");
      ghostTextToggle.className = "gregify-toggle";
      ghostTextToggle.style.display = "flex";
      ghostTextToggle.style.alignItems = "center";
      ghostTextToggle.style.cursor = "pointer";
      ghostTextToggle.dataset.active = "true";

      // Create toggle switch appearance
      const toggleSwitch = document.createElement("span");
      toggleSwitch.className = "gregify-switch";
      toggleSwitch.style.position = "relative";
      toggleSwitch.style.display = "inline-block";
      toggleSwitch.style.width = "30px";
      toggleSwitch.style.height = "16px";
      toggleSwitch.style.backgroundColor = "#4CAF50";
      toggleSwitch.style.borderRadius = "8px";
      toggleSwitch.style.marginRight = "6px";
      toggleSwitch.style.transition = "background-color 0.3s";

      // Create toggle switch handle
      const toggleHandle = document.createElement("span");
      toggleHandle.className = "gregify-handle";
      toggleHandle.style.position = "absolute";
      toggleHandle.style.top = "2px";
      toggleHandle.style.right = "2px";
      toggleHandle.style.width = "12px";
      toggleHandle.style.height = "12px";
      toggleHandle.style.backgroundColor = "white";
      toggleHandle.style.borderRadius = "50%";
      toggleHandle.style.transition = "transform 0.3s";

      toggleSwitch.appendChild(toggleHandle);

      // Create toggle label
      const toggleLabel = document.createElement("span");
      toggleLabel.textContent = "Ghost Text";
      toggleLabel.style.fontSize = "12px";

      ghostTextToggle.appendChild(toggleSwitch);
      ghostTextToggle.appendChild(toggleLabel);

      ghostTextToggle.onclick = function () {
        const isActive = ghostTextToggle.dataset.active === "true";
        ghostTextToggle.dataset.active = isActive ? "false" : "true";

        // Update toggle appearance
        if (isActive) {
          // Turning off
          toggleSwitch.style.backgroundColor = "#ccc";
          toggleHandle.style.transform = "translateX(-14px)";
        } else {
          // Turning on
          toggleSwitch.style.backgroundColor = "#4CAF50";
          toggleHandle.style.transform = "translateX(0)";
        }

        if (isActive) {
          // Hide suggestion container when turning off
          if (suggestionContainer) {
            suggestionContainer.style.display = "none";
          }
        }
      };

      controlsContainer.appendChild(ghostTextToggle);

      // Try to find and attach input listeners
      findAndAttachListeners();
    }
  }

  // Simple function to inject text
  function injectTextToInput(text) {
    console.log("Trying to inject:", text);
    debugInfo.lastAction = "inject-" + new Date().toISOString();

    // Try multiple selectors to find the input element
    const selectors = [
      "#prompt-textarea",
      "#prompt-textarea > p",
      'textarea[data-id="prompt-textarea"]',
      'div[contenteditable="true"]',
      "textarea",
      '[role="textbox"]',
    ];

    let inputElement = null;

    // Try each selector
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Found element with selector: ${selector}`);
        inputElement = element;
        debugInfo.elementsFound[selector] = {
          found: true,
          type: element.tagName,
          contentEditable: element.getAttribute("contenteditable") === "true",
        };
        break;
      } else {
        debugInfo.elementsFound[selector] = { found: false };
      }
    }

    if (!inputElement) {
      console.log("Could not find input element");
      return false;
    }

    // Inject the text based on element type
    try {
      if (inputElement instanceof HTMLTextAreaElement) {
        inputElement.value = text;
      } else if (inputElement.getAttribute("contenteditable") === "true") {
        inputElement.textContent = text;
      } else {
        // Try both methods
        try {
          inputElement.value = text;
        } catch (e) {}
        try {
          inputElement.textContent = text;
        } catch (e) {}
      }

      // Try to trigger input event
      const inputEvent = new Event("input", { bubbles: true });
      inputElement.dispatchEvent(inputEvent);

      // Try to find and click submit button
      const submitButton = document.querySelector(
        'button[data-testid="send-button"], button[aria-label="Send message"]'
      );
      if (submitButton) {
        submitButton.click();
      }

      return true;
    } catch (error) {
      console.error("Injection error:", error);
      return false;
    }
  }

  // Create suggestion UI for ghost text
  function createSuggestionUI() {
    if (!suggestionContainer) {
      console.log("Creating suggestion container");
      suggestionContainer = document.createElement("div");
      suggestionContainer.className = "gregify-suggestion-container";
      suggestionContainer.style.position = "absolute";
      suggestionContainer.style.zIndex = "1000";
      suggestionContainer.style.backgroundColor = "rgba(52, 53, 65, 0.7)";
      suggestionContainer.style.color = "#acacbe";
      suggestionContainer.style.borderRadius = "4px";
      suggestionContainer.style.padding = "8px 12px";
      suggestionContainer.style.fontSize = "14px";
      suggestionContainer.style.display = "none";
      suggestionContainer.style.maxWidth = "90%";
      suggestionContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
      suggestionContainer.style.backdropFilter = "blur(5px)";

      // Add a small hint about Tab key
      const tabHint = document.createElement("div");
      tabHint.textContent = "Press Tab to accept";
      tabHint.style.fontSize = "10px";
      tabHint.style.opacity = "0.7";
      tabHint.style.marginTop = "4px";
      suggestionContainer.appendChild(tabHint);

      document.body.appendChild(suggestionContainer);
      console.log("Suggestion container added to DOM");
    }
    return suggestionContainer;
  }

  // Position the suggestion container near the cursor
  function positionSuggestionContainer() {
    if (!textareaElement || !suggestionContainer) {
      console.log("Cannot position suggestion container - missing elements");
      return;
    }

    const rect = textareaElement.getBoundingClientRect();
    console.log(`Textarea position: ${rect.top}, ${rect.left}`);

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
    console.log(`Cursor at line ${currentLine} of text`);

    suggestionContainer.style.top = `${
      rect.top + 10 + (currentLine - 1) * lineHeight
    }px`;
    suggestionContainer.style.left = `${rect.left + 10}px`;
  }

  // Get suggestions from the background script
  async function getSuggestions(input) {
    if (!input.trim()) return "";

    console.log(`Getting suggestions for input: ${input.substring(0, 20)}...`);

    try {
      // Send a message to the background script to make the API call
      console.log("Sending message to background script");
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "getAutocompleteSuggestion",
            prompt: input,
          },
          (response) => {
            if (response && response.success && response.suggestion) {
              // Remove fallback messages if they exist
              let suggestion = response.suggestion;
              suggestion = suggestion.replace(
                " [could not connect to suggestion API]",
                ""
              );
              suggestion = suggestion.replace(
                " [API couldn't generate a suggestion]",
                ""
              );

              // Only return if it's a meaningful suggestion
              if (
                suggestion !== input &&
                !suggestion.includes("[could not connect")
              ) {
                resolve(suggestion);
              } else {
                resolve("");
              }
            } else {
              resolve("");
            }
          }
        );
      });
    } catch (error) {
      console.log(`Error getting suggestions: ${error.message}`);
      return "";
    }
  }

  // Handle input events for ghost text
  function handleInput(event) {
    console.log(`Input event detected: ${event.type}`);

    // Check if ghost text is enabled
    const ghostTextToggle = document.querySelector(".gregify-toggle");
    if (ghostTextToggle && ghostTextToggle.dataset.active !== "true") {
      console.log("Ghost text is disabled");
      return;
    }

    if (!event.target) {
      console.log("No event target found");
      return;
    }

    textareaElement = event.target;
    console.log(`Textarea element found: ${textareaElement.tagName}`);

    let input = "";
    if (textareaElement instanceof HTMLTextAreaElement) {
      input = textareaElement.value;
    } else {
      input = textareaElement.textContent || "";
    }

    // If the input is the same as last time, don't do anything
    if (input === lastInput) {
      console.log("Input unchanged, skipping");
      return;
    }

    console.log(`New input detected: ${input.substring(0, 20)}...`);
    lastInput = input;

    // Clear any existing debounce timer
    if (debounceTimer) {
      console.log("Clearing existing debounce timer");
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer
    console.log("Setting new debounce timer (500ms)");
    debounceTimer = setTimeout(async () => {
      console.log("Debounce timer expired, processing input");

      // Only get suggestions if the input is not empty and has at least a few characters
      if (input.trim() && input.trim().length > 3) {
        console.log("Input not empty, getting suggestions");
        const suggestion = await getSuggestions(input);

        if (suggestion && suggestion !== input) {
          console.log(
            `Valid suggestion received: ${suggestion.substring(0, 30)}...`
          );
          currentSuggestion = suggestion;
          suggestionActive = true;

          // Create and position the suggestion UI
          const container = createSuggestionUI();
          positionSuggestionContainer();

          // Display the suggestion
          const suggestionText = document.createElement("div");
          suggestionText.textContent = suggestion;

          // Clear previous content
          container.innerHTML = "";
          container.appendChild(suggestionText);

          // Add the Tab key hint
          const tabHint = document.createElement("div");
          tabHint.textContent = "Press Tab to accept";
          tabHint.style.fontSize = "10px";
          tabHint.style.opacity = "0.7";
          tabHint.style.marginTop = "4px";
          container.appendChild(tabHint);

          container.style.display = "block";
          console.log("Showing suggestion");
        } else {
          // Hide the suggestion UI if no valid suggestion
          if (suggestionContainer) {
            suggestionContainer.style.display = "none";
            console.log("No valid suggestion, hiding suggestion UI");
          }
          suggestionActive = false;
        }
      } else {
        // Hide the suggestion UI if input is empty
        if (suggestionContainer) {
          suggestionContainer.style.display = "none";
          console.log("Input empty, hiding suggestion UI");
        }
        suggestionActive = false;
      }
    }, 500);
  }

  // Handle keydown for accepting suggestions with Tab
  function handleKeyDown(event) {
    console.log(`Key pressed: ${event.key}`);

    if (event.key === "Tab" && suggestionActive && currentSuggestion) {
      console.log(
        "Tab key pressed with active suggestion, accepting suggestion"
      );
      event.preventDefault();

      // Apply the suggestion
      if (textareaElement) {
        console.log(
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
        console.log("Dispatched input and change events");

        // Hide the suggestion container
        if (suggestionContainer) {
          suggestionContainer.style.display = "none";
          console.log("Hidden suggestion container");
        }

        suggestionActive = false;
        lastInput = currentSuggestion;
      }
    }
  }

  // Find and attach event listeners to ChatGPT textarea
  function findAndAttachListeners() {
    if (listenersAttached) {
      console.log("Listeners already attached, skipping");
      return true;
    }

    console.log("Finding ChatGPT textarea and attaching listeners");

    // Try various selectors for the ChatGPT textarea
    const selectors = [
      "#prompt-textarea",
      'textarea[data-id="prompt-textarea"]',
      'div[contenteditable="true"][id="prompt-textarea"]',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"]',
      "textarea",
      '[role="textbox"]',
    ];

    // Try each selector until we find a match
    for (const selector of selectors) {
      const textarea = document.querySelector(selector);
      if (textarea) {
        console.log(`Found textarea with selector: ${selector}`);

        textareaElement = textarea;

        // Add input event listener
        textarea.addEventListener("input", handleInput);
        console.log("Added input event listener");

        // Add keydown event listener for accepting suggestions with Tab
        textarea.addEventListener("keydown", handleKeyDown);
        console.log("Added keydown event listener");

        listenersAttached = true;
        return true;
      }
    }

    console.log("Could not find ChatGPT textarea with any selector");
    return false;
  }

  // Initialize when document is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Also try again after a delay in case page loads slowly
  setTimeout(init, 1000);
  setTimeout(init, 3000);

  // Set up MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    if (!listenersAttached) {
      console.log("DOM mutation observed, trying to find textarea again");
      findAndAttachListeners();
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for messages from the popup
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.onMessage
  ) {
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      console.log("Message received in basicScript:", request);

      if (request.action === "injectPrompt") {
        const success = injectTextToInput(request.prompt);
        sendResponse({ success });
      }

      if (request.action === "getDebugInfo") {
        debugInfo.url = window.location.href;
        debugInfo.timestamp = new Date().toISOString();
        debugInfo.readyState = document.readyState;

        sendResponse(debugInfo);
      }

      // Return true to indicate we will send an async response
      return true;
    });
  } else {
    console.warn(
      "Chrome runtime API not available - running in non-extension context"
    );
  }
})();
