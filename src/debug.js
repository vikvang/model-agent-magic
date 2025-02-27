// This will be injected directly to help with debugging
(function () {
  // IMMEDIATELY SHOW AN ALERT TO CONFIRM SCRIPT IS RUNNING
  alert("GREGIFY DEBUG SCRIPT IS RUNNING!");

  console.log(
    "%c GREGIFY DEBUG SCRIPT INJECTED ",
    "background: green; color: white; font-size: 40px; padding: 20px;"
  );

  // Create a HUGE visual indicator on the page
  const debugOverlay = document.createElement("div");
  debugOverlay.style.position = "fixed";
  debugOverlay.style.top = "0";
  debugOverlay.style.left = "0";
  debugOverlay.style.width = "100%";
  debugOverlay.style.height = "80px";
  debugOverlay.style.backgroundColor = "red";
  debugOverlay.style.color = "white";
  debugOverlay.style.fontSize = "30px";
  debugOverlay.style.padding = "20px";
  debugOverlay.style.zIndex = "999999";
  debugOverlay.style.textAlign = "center";
  debugOverlay.style.fontWeight = "bold";
  debugOverlay.textContent = "GREGIFY DEBUG ACTIVE";
  document.body.appendChild(debugOverlay);

  // Store in localStorage for debugging
  localStorage.setItem(
    "gregify_debug_activated",
    "YES - " + new Date().toISOString()
  );

  // Check if our content script exists in the page
  const gregifyDebug = localStorage.getItem("gregify_debug");
  console.log("Gregify Debug Info:", gregifyDebug);

  // Add visual indicator to the page
  const debugElement = document.createElement("div");
  debugElement.style.position = "fixed";
  debugElement.style.bottom = "10px";
  debugElement.style.right = "10px";
  debugElement.style.backgroundColor = "green";
  debugElement.style.color = "white";
  debugElement.style.padding = "5px 10px";
  debugElement.style.borderRadius = "5px";
  debugElement.style.zIndex = "9999";
  debugElement.style.fontSize = "12px";
  debugElement.textContent = "Gregify Debug Active";
  document.body.appendChild(debugElement);

  // Create a debug log element
  const logElement = document.createElement("div");
  logElement.className = "gregify-debug-log"; // Add a class for the content script to target
  logElement.style.position = "fixed";
  logElement.style.bottom = "40px";
  logElement.style.right = "10px";
  logElement.style.backgroundColor = "rgba(0,0,0,0.7)";
  logElement.style.color = "white";
  logElement.style.padding = "10px";
  logElement.style.borderRadius = "5px";
  logElement.style.zIndex = "9999";
  logElement.style.maxHeight = "300px";
  logElement.style.overflowY = "auto";
  logElement.style.width = "300px";
  logElement.style.fontSize = "10px";
  logElement.style.fontFamily = "monospace";
  logElement.innerHTML = "<strong>Gregify Debug Log:</strong><br>";
  document.body.appendChild(logElement);

  // Function to add logs to our visual log element
  function addLog(message) {
    const time = new Date().toISOString().substring(11, 19);
    logElement.innerHTML += `[${time}] ${message}<br>`;
    logElement.scrollTop = logElement.scrollHeight;
    console.log(`GREGIFY-DEBUG: ${message}`);
  }

  addLog("Debug script loaded");

  // Check the URL we're on
  addLog(`Current URL: ${window.location.href}`);

  // Find and log all textareas and contenteditable elements
  const allTextareas = document.querySelectorAll("textarea");
  const allContentEditables = document.querySelectorAll(
    'div[contenteditable="true"]'
  );

  addLog(`Found ${allTextareas.length} textareas`);
  allTextareas.forEach((el, i) => {
    console.log(`Textarea #${i}:`, {
      id: el.id,
      className: el.className,
      placeholder: el.placeholder,
      attributes: Array.from(el.attributes)
        .map((a) => `${a.name}="${a.value}"`)
        .join(", "),
    });

    if (i < 3) {
      // Log first few textareas to our visual log
      addLog(
        `Textarea #${i}: id=${el.id}, class=${el.className.substring(0, 20)}...`
      );
    }
  });

  addLog(`Found ${allContentEditables.length} contenteditable divs`);
  allContentEditables.forEach((el, i) => {
    console.log(`Contenteditable #${i}:`, {
      id: el.id,
      className: el.className,
      attributes: Array.from(el.attributes)
        .map((a) => `${a.name}="${a.value}"`)
        .join(", "),
    });

    if (i < 3) {
      // Log first few to our visual log
      addLog(
        `Contenteditable #${i}: id=${el.id}, class=${el.className.substring(
          0,
          20
        )}...`
      );
    }
  });

  // New specific selectors based on user feedback
  const specificSelectors = [
    // User-specified selector
    "#prompt-textarea > p",
    // Other variations to try
    "#prompt-textarea",
    ".ProseMirror p", // Some ChatGPT versions use ProseMirror editor
    "[data-slate-editor]", // Some use Slate editor
    "#prompt-textarea > div",
    "[role='textbox']",
    "[contenteditable='true']",
    "[data-lexical-editor]", // Some use Lexical editor
  ];

  addLog("Trying specific selectors from user feedback:");
  specificSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    addLog(`Selector "${selector}": found ${elements.length} elements`);

    elements.forEach((el, i) => {
      if (i < 2) {
        // Only log first couple to avoid spam
        addLog(
          `- Element ${i}: ${el.tagName}, id=${
            el.id
          }, class=${el.className.substring(0, 15)}...`
        );
        console.log(`Special selector "${selector}" element ${i}:`, el);
      }
    });
  });

  // Try various selectors for ChatGPT textarea
  const selectors = [
    'textarea[data-id="prompt-textarea"]',
    'div[contenteditable="true"][id="prompt-textarea"]',
    'textarea[placeholder*="Send a message"]',
    'div[contenteditable="true"]',
    "#prompt-textarea", // Direct ID selector
    "#prompt-textarea > p", // User's specific selector
    "textarea",
    '[role="textbox"]',
    ".chat-pg-box textarea",
  ];

  let textarea = null;
  for (const selector of selectors) {
    const found = document.querySelector(selector);
    if (found) {
      addLog(`Found input with selector: ${selector}`);
      textarea = found;
      break;
    } else {
      addLog(`No match for selector: ${selector}`);
    }
  }

  // If no element found with specific selectors, try deeper search
  if (!textarea) {
    addLog("No element found with standard selectors, trying deeper search...");

    // Try looking for elements with specific attributes or text content
    const allElements = document.querySelectorAll("*");
    addLog(`Scanning ${allElements.length} elements for potential inputs...`);

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];

      // Skip script, style, and purely layout elements
      if (
        ["SCRIPT", "STYLE", "META", "LINK", "BR", "HR"].includes(el.tagName)
      ) {
        continue;
      }

      // Check for elements that look like inputs
      if (
        el.getAttribute("contenteditable") === "true" ||
        el.getAttribute("role") === "textbox" ||
        el.getAttribute("data-id") === "prompt-textarea" ||
        el.id === "prompt-textarea" ||
        (el.tagName === "DIV" && el.getAttribute("tabindex") === "0") ||
        el.matches('div[data-content-editable-leaf="true"]')
      ) {
        addLog(
          `Found potential input: ${el.tagName}, id=${
            el.id
          }, class=${el.className.substring(0, 15)}...`
        );
        console.log("Potential input element:", el);

        // If we haven't found a textarea yet, use this one
        if (!textarea) {
          textarea = el;
          addLog("Setting this element as the textarea");
        }
      }
    }
  }

  if (textarea) {
    addLog(
      `Found ChatGPT input: id=${
        textarea.id
      }, class=${textarea.className.substring(0, 20)}...`
    );
    debugElement.textContent = "Gregify: ChatGPT Input Found";
    debugElement.style.backgroundColor = "blue";

    // Display some info about the element
    addLog(`Element type: ${textarea.tagName.toLowerCase()}`);
    addLog(`Is visible: ${textarea.offsetParent !== null}`);
    addLog(
      `Parent: ${
        textarea.parentElement
          ? textarea.parentElement.tagName + "#" + textarea.parentElement.id
          : "none"
      }`
    );
    addLog(`Children: ${textarea.children.length}`);

    // Log full path to element
    let elementPath = [];
    let currentEl = textarea;
    while (currentEl && currentEl !== document.body) {
      const tagName = currentEl.tagName.toLowerCase();
      const id = currentEl.id ? `#${currentEl.id}` : "";
      const classes = currentEl.className
        ? `.${currentEl.className.split(" ").join(".")}`
        : "";
      elementPath.unshift(`${tagName}${id}${classes}`);
      currentEl = currentEl.parentElement;
    }
    addLog(`Element path: ${elementPath.join(" > ")}`);

    // Try manually adding an event listener
    textarea.addEventListener("input", function (e) {
      console.log("DEBUG: Manual input event captured", e);
      debugElement.textContent =
        "Input Detected: " + new Date().toISOString().substring(11, 19);
      addLog(
        `Input detected: "${
          e.target.value || e.target.textContent || ""
        }"`.substring(0, 50)
      );
    });

    // Add visual highlight to the textarea
    const originalBorder = textarea.style.border;
    textarea.style.border = "2px solid #ff0000";
    setTimeout(() => {
      textarea.style.border = originalBorder;
    }, 3000);
  } else {
    addLog("Could not find ChatGPT input with any selector");
    debugElement.style.backgroundColor = "red";
    debugElement.textContent = "Gregify: No ChatGPT Input Found";
  }

  // Try finding the actual input mechanism that ChatGPT uses
  addLog("Searching for editor instances in window object...");
  if (window.editor) {
    addLog("Found window.editor!");
    console.log("Editor instance:", window.editor);
  }

  // Look for React instances that might contain the editor
  addLog("Checking for React internal data...");
  const reactRoots = document.querySelectorAll("[data-reactroot]");
  addLog(`Found ${reactRoots.length} React roots`);

  // Check for contentScript global var
  if (window.gregifyContentScriptLoaded) {
    addLog("Content script global variable found! ✅");
    debugElement.textContent += " | CS ✅";
    debugOverlay.textContent += " | CONTENT SCRIPT DETECTED";
  } else {
    addLog("Content script global variable NOT found ❌");
    debugElement.textContent += " | CS ❌";
    debugOverlay.textContent += " | NO CONTENT SCRIPT FOUND!";
  }

  // Check for extension context
  try {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      addLog("Chrome extension API available ✅");
      debugElement.textContent += " | API ✅";
    } else {
      addLog("Chrome extension API NOT available ❌");
      debugElement.textContent += " | API ❌";

      // If no Chrome API, try to diagnose why
      alert(
        "Chrome extension API not found. Extension may not be running properly."
      );
    }
  } catch (e) {
    addLog(`Error checking extension context: ${e.message}`);
    alert("Error checking extension context: " + e.message);
  }

  // Add a toggle button for the log
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Toggle Log";
  toggleButton.style.position = "fixed";
  toggleButton.style.bottom = "10px";
  toggleButton.style.right = "150px";
  toggleButton.style.zIndex = "9999";
  toggleButton.style.padding = "5px";
  toggleButton.addEventListener("click", () => {
    logElement.style.display =
      logElement.style.display === "none" ? "block" : "none";
  });
  document.body.appendChild(toggleButton);

  // Add a button to test injecting some text
  const testButton = document.createElement("button");
  testButton.textContent = "Test Text Injection";
  testButton.style.position = "fixed";
  testButton.style.bottom = "10px";
  testButton.style.right = "250px";
  testButton.style.zIndex = "9999";
  testButton.style.padding = "5px";
  testButton.addEventListener("click", () => {
    addLog("Testing text injection...");
    if (textarea) {
      // Try different methods to set text
      try {
        if (textarea instanceof HTMLTextAreaElement) {
          textarea.value = "This is a test message from Gregify";
        } else if (textarea.getAttribute("contenteditable") === "true") {
          textarea.textContent = "This is a test message from Gregify";
        }

        // Try to dispatch input event
        const event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);

        addLog("Text injection attempted");
      } catch (e) {
        addLog(`Error injecting text: ${e.message}`);
      }
    } else {
      addLog("No textarea found for text injection");
    }
  });
  document.body.appendChild(testButton);

  // Check DOM changes for dynamic elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        if (!textarea) {
          // Recheck for textarea if we haven't found it yet
          for (const selector of selectors) {
            const found = document.querySelector(selector);
            if (found && found !== textarea) {
              textarea = found;
              addLog(`Input found after DOM change with selector: ${selector}`);
              debugElement.textContent = "Gregify: Input Found (delayed)";
              debugElement.style.backgroundColor = "purple";
              break;
            }
          }
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  addLog("DOM observer started");

  // Add a variable to the window object so contentScript can detect the debug script
  window.gregifyDebugScriptLoaded = true;
  addLog("Set global flag: gregifyDebugScriptLoaded = true");

  // Add a timer to keep checking for the content script
  setInterval(() => {
    if (window.gregifyContentScriptLoaded) {
      debugOverlay.style.backgroundColor = "green";
      debugOverlay.textContent = "GREGIFY DEBUG & CONTENT SCRIPT ACTIVE";
    }
  }, 1000);
})();
