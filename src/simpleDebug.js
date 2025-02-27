// Ultra simple debug script with no dependencies
console.log("SIMPLE DEBUG RUNNING");
alert("SIMPLE DEBUG SCRIPT");

// Create an absolutely positioned element that can't be missed
const simpleDebug = document.createElement("div");
simpleDebug.textContent = "SIMPLE DEBUG ACTIVE";
simpleDebug.style.position = "fixed";
simpleDebug.style.top = "300px";
simpleDebug.style.left = "0";
simpleDebug.style.width = "100%";
simpleDebug.style.backgroundColor = "orange";
simpleDebug.style.color = "black";
simpleDebug.style.fontSize = "30px";
simpleDebug.style.padding = "20px";
simpleDebug.style.zIndex = "9999999";
simpleDebug.style.textAlign = "center";
document.body.appendChild(simpleDebug);

// Add the debug element even if the body isn't ready yet
if (!document.body) {
  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(simpleDebug);
  });
}

// Try running this ultra-simple version
try {
  alert("SIMPLE DEBUG: DOM MANIPULATION WORKED");
} catch (e) {
  alert("SIMPLE DEBUG ERROR: " + e.message);
}
