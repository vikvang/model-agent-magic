// Content script for interacting with ChatGPT
console.log("%c 🚀 GREGIFY CONTENT SCRIPT LOADED 🚀", "background: #FF6B4A; color: white; font-size: 14px; padding: 5px; border-radius: 5px;");

// Create and insert CSS styles for notifications
const styleElement = document.createElement('style');
styleElement.textContent = `
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
`;
document.head.appendChild(styleElement);

// Function to show notification
function showNotification(message, type = 'success', duration = 5000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `gregify-notification ${type}`;
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  
  // Add content
  notification.innerHTML = `
    <div class="gregify-notification-icon">✨</div>
    <div class="gregify-notification-content">${message}</div>
    <div class="gregify-notification-close">×</div>
    <div class="gregify-progress-bar"></div>
  `;
  
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
    showNotification(`Enhanced prompt inserted: "${promptPreview}"`, 'success');

    console.log("%c Successfully populated ChatGPT textarea", "background: #4CAF50; color: white; font-weight: bold;");
  } catch (error) {
    console.error("%c Error populating ChatGPT textarea:", "background: #F44336; color: white;", error);
    showNotification("Error populating ChatGPT textarea", "error");
  }
}