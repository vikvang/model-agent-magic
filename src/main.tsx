import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { clerkConfig, CLERK_PUBLISHABLE_KEY } from "./config/clerk";
import App from "./App";
import "./index.css";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkConfig.appearance}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
