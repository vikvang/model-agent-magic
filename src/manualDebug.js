// Copy this entire script and paste it into the browser console on chat.openai.com

(function () {
  // Show alert to confirm script is running
  alert("MANUAL DEBUG SCRIPT RUNNING");

  console.log("MANUAL DEBUG SCRIPT LOADED", new Date().toISOString());

  // Create visual indicator
  const debugDiv = document.createElement("div");
  debugDiv.style.position = "fixed";
  debugDiv.style.top = "200px";
  debugDiv.style.left = "0";
  debugDiv.style.width = "100%";
  debugDiv.style.height = "40px";
  debugDiv.style.backgroundColor = "purple";
  debugDiv.style.color = "white";
  debugDiv.style.fontSize = "20px";
  debugDiv.style.padding = "10px";
  debugDiv.style.zIndex = "9999999";
  debugDiv.style.textAlign = "center";
  debugDiv.textContent = "MANUAL DEBUG ACTIVE";
  document.body.appendChild(debugDiv);

  // Log all important elements
  console.log("=== CHATGPT INPUT ELEMENT SEARCH ===");

  // Log document readyState
  console.log("Document readyState:", document.readyState);

  // Test all possible selectors
  const selectors = [
    "#prompt-textarea",
    "#prompt-textarea > p",
    "textarea[data-id='prompt-textarea']",
    "div[contenteditable='true']",
    "textarea",
    "[role='textbox']",
  ];

  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    console.log(
      `Selector "${selector}" matches ${elements.length} elements:`,
      elements
    );

    if (elements.length > 0) {
      debugDiv.textContent += ` | Found: ${selector}`;
    }

    // Try to add event listeners to each match
    elements.forEach((el, i) => {
      try {
        el.addEventListener("input", function (e) {
          console.log(`Input detected on ${selector} element #${i}:`, e);
          alert(`Input detected on ${selector}`);
        });
        console.log(`Added input listener to ${selector} element #${i}`);
      } catch (err) {
        console.error(
          `Failed to add listener to ${selector} element #${i}:`,
          err
        );
      }
    });
  });

  // Check for extension
  if (window.gregifyContentScriptLoaded) {
    console.log("Content script detected in window scope");
    debugDiv.textContent += " | Extension script found!";
  } else {
    console.log("No content script detected in window scope");
    debugDiv.textContent += " | No extension script!";
  }

  // Check localStorage
  const debugInfo = localStorage.getItem("gregify_debug");
  console.log("LocalStorage debug info:", debugInfo);

  // Add button to manually try injection
  const injectButton = document.createElement("button");
  injectButton.textContent = "Try Text Injection";
  injectButton.style.position = "fixed";
  injectButton.style.top = "250px";
  injectButton.style.left = "10px";
  injectButton.style.zIndex = "9999999";
  injectButton.style.padding = "10px";
  injectButton.addEventListener("click", function () {
    console.log("Trying text injection");

    // Try the most specific approach first - user's selector
    const pElement = document.querySelector("#prompt-textarea > p");
    if (pElement) {
      pElement.textContent = "This is a test message from manual injection";
      console.log("Injected to #prompt-textarea > p");
      alert("Injected to paragraph inside prompt-textarea");
      return;
    }

    // Try direct selector
    const textarea = document.querySelector("#prompt-textarea");
    if (textarea) {
      if (textarea.tagName === "TEXTAREA") {
        textarea.value = "This is a test message from manual injection";
      } else {
        textarea.textContent = "This is a test message from manual injection";
      }
      console.log("Injected to #prompt-textarea");
      alert("Injected to prompt-textarea");
      return;
    }

    // Alert if nothing found
    alert("Could not find any suitable element for injection");
  });
  document.body.appendChild(injectButton);

  // Return summary
  return {
    readyState: document.readyState,
    selectors: selectors.map((s) => ({
      selector: s,
      count: document.querySelectorAll(s).length,
    })),
    hasExtension: !!window.gregifyContentScriptLoaded,
    localStorage: debugInfo,
  };
})();
