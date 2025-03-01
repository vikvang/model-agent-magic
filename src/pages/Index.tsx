import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback, useRef } from "react";
import { ApiService } from "@/services/apiService";
import { PromptControls } from "@/components/prompt/PromptControls";
import ReactMarkdown from "react-markdown";
import { CopyButton } from "@/components/ui/copy-button";
import { Info, AlertCircle } from "lucide-react";
import { AgentRole, ModelType } from "@/types/agent";
import { UserSettings } from "@/components/auth/UserSettings";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  // Shared state
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt4");
  const [selectedRole, setSelectedRole] = useState<AgentRole>("webdev");
  const [prompt, setPrompt] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to show a toast notification
  const showToast = (message: string, duration = 3000) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    // Set the toast message
    setToastMessage(message);
    
    // Set a timeout to clear the toast
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };
  
  // Clean up toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Set session ID when user auth is loaded
  useEffect(() => {
    if (user?.id) {
      setSessionId(user.id);
      console.log("Using authenticated user ID for session:", user.id);
    }
  }, [user]);

  // Normal mode state
  const [normalResponse, setNormalResponse] = useState("");

  // State for separated response parts in NORMAL mode
  const [normalResponseParts, setNormalResponseParts] = useState<{
    enhancedPrompt: string;
    explanation: string;
  }>({
    enhancedPrompt: "",
    explanation: "",
  });

  // Progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && progress < 99) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 15;
          const newProgress = prev + increment;
          return newProgress < 99 ? newProgress : 99;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isLoading, progress]);

  // Function to parse response text into enhanced prompt and explanation
  const parseNormalResponse = useCallback((response: string) => {
    console.log("Parsing response:", response);
    
    // Check if the response is empty or undefined
    if (!response || response.trim() === '') {
      console.error("Empty response received");
      return { enhancedPrompt: "", explanation: "" };
    }
    
    // First approach: Try to find "Improved Prompt" section (sometimes the model uses this instead)
    const improvedPromptIndex = response.toLowerCase().indexOf("improved prompt");
    if (improvedPromptIndex !== -1) {
      console.log("Found 'Improved Prompt' section");
      // Extract from "Improved Prompt" to the next major section
      let startIndex = improvedPromptIndex + "improved prompt".length;
      
      // Skip over formatting characters
      while (startIndex < response.length && 
             (response[startIndex] === ':' || 
              response[startIndex] === ' ' || 
              response[startIndex] === '"' ||
              response[startIndex] === '"' ||
              response[startIndex] === '"' ||
              response[startIndex] === '\n')) {
        startIndex++;
      }
      
      // Find the end of the improved prompt section
      const nextSectionMarkers = ["explanation:", "--", "===", "***"];
      let endIndex = response.length;
      
      for (const marker of nextSectionMarkers) {
        const markerIndex = response.toLowerCase().indexOf(marker, startIndex);
        if (markerIndex !== -1 && markerIndex < endIndex) {
          endIndex = markerIndex;
        }
      }
      
      const enhancedPrompt = response.substring(startIndex, endIndex).trim();
      const explanation = response.substring(endIndex).trim();
      
      return { enhancedPrompt, explanation };
    }
    
    // Second approach: Try to find "Enhanced prompt" section
    const fullRegexPattern = /(?:Enhanced prompt(?:\s*|:\s*|["""]?\s*))([^]*?)(?:(?:\n\n|\r\n\r\n)(?:Explanation(?:\s*|:\s*)|(?:-{3,}))([^]*))/i;
    const match = response.match(fullRegexPattern);
    
    if (match && match.length >= 3) {
      console.log("Matched full structured format");
      return {
        enhancedPrompt: match[1].trim(),
        explanation: match[2].trim()
      };
    }
    
    // Third approach: Look for keywords and structure
    const enhancedPromptMarker = response.toLowerCase().indexOf("enhanced prompt");
    const explanationMarker = response.toLowerCase().indexOf("explanation");
    
    if (enhancedPromptMarker !== -1) {
      let enhancedStart = enhancedPromptMarker + "enhanced prompt".length;
      
      // Skip over any characters like ":", spaces, quotes
      while (enhancedStart < response.length && 
             (response[enhancedStart] === ':' || 
              response[enhancedStart] === ' ' || 
              response[enhancedStart] === '"' ||
              response[enhancedStart] === '"' ||
              response[enhancedStart] === '"' ||
              response[enhancedStart] === '\n')) {
        enhancedStart++;
      }
      
      let enhancedEnd;
      if (explanationMarker !== -1 && explanationMarker > enhancedPromptMarker) {
        // If we found "Explanation", look for the start of that section
        enhancedEnd = explanationMarker;
        
        // Find the start of the line containing "Explanation"
        let lineStart = enhancedEnd;
        while (lineStart > 0 && response[lineStart - 1] !== '\n') {
          lineStart--;
        }
        
        enhancedEnd = lineStart;
      } else {
        // If no explanation marker, look for separator lines like "---"
        const separatorMatch = response.substring(enhancedStart).match(/\n(-{3,}|\*{3,}|\_{3,})\n/);
        if (separatorMatch) {
          enhancedEnd = enhancedStart + separatorMatch.index;
        } else {
          // If no separator found, assume the entire rest is the prompt
          enhancedEnd = response.length;
        }
      }
      
      console.log("Using keyword-based extraction", enhancedStart, enhancedEnd);
      
      const enhancedPrompt = response.substring(enhancedStart, enhancedEnd).trim();
      const explanation = (explanationMarker !== -1) 
        ? response.substring(explanationMarker + "explanation".length).replace(/^[:\s]+/, "").trim()
        : "";
      
      return { enhancedPrompt, explanation };
    }
    
    // Fallback: Use simple heuristic to find any block of text that looks like a prompt
    console.log("No structured format detected, using fallback heuristic");
    
    // Split by double newlines to find paragraphs
    const paragraphs = response.split(/\n\n+/);
    if (paragraphs.length > 1) {
      // Assume the first substantial paragraph (>20 chars) is the prompt
      for (const para of paragraphs) {
        if (para.trim().length > 20) {
          return {
            enhancedPrompt: para.trim(),
            explanation: response.substring(response.indexOf(para) + para.length).trim()
          };
        }
      }
    }
    
    // Last resort - return the whole thing as the prompt
    return {
      enhancedPrompt: response,
      explanation: ""
    };
  }, []);

  // Function to send enhanced prompt to ChatGPT
  const sendToChatGPT = useCallback((enhancedPrompt: string) => {
    console.log("Handling enhanced prompt:", enhancedPrompt);

    if (!enhancedPrompt || enhancedPrompt.trim() === '') {
      console.error("Cannot handle empty prompt");
      return;
    }

    // Primary approach: Copy to clipboard automatically
    try {
      navigator.clipboard.writeText(enhancedPrompt)
        .then(() => {
          console.log("Enhanced prompt copied to clipboard successfully");
          showToast("Enhanced prompt copied to clipboard! Switch to ChatGPT tab and paste.");
        })
        .catch(err => {
          console.error("Error copying to clipboard:", err);
          showToast("Failed to copy to clipboard. Please use the Copy button manually.");
        });
    } catch (clipboardErr) {
      console.error("Clipboard API error:", clipboardErr);
      showToast("Error accessing clipboard. Please use the Copy button manually.");
    }

    // Secondary approach: Try extension messaging (likely won't work but keeping as fallback)
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        console.log("Attempting extension messaging as fallback");
        
        chrome.runtime.sendMessage(
          {
            action: "enhancedPromptReady",
            enhancedPrompt,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Extension messaging error:", chrome.runtime.lastError);
            } else {
              console.log("Extension message sent:", response);
            }
          }
        );
      } catch (err) {
        console.error("Extension messaging error:", err);
      }
    }
  }, [showToast]);

  const handleGregify = async () => {
    // Check if a valid model is selected
    if (selectedModel === 'none') {
      setNormalResponse("Error: No API keys available. Please add your API keys in your profile settings to use the application.");
      return;
    }
    
    // Check if we have a valid user ID
    if (!sessionId) {
      setNormalResponse("Error: You must be logged in to use this feature. Please log in and try again.");
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    // Clear normal response parts
    setNormalResponseParts({ enhancedPrompt: "", explanation: "" });
    setIsProcessing(true);
    
    try {
      // Determine the appropriate AI provider based on selected model
      let aiProvider = "openai"; // Default
      
      if (selectedModel === "deepseek") {
        aiProvider = "deepseek";
      } else if (selectedModel === "gpt4" || selectedModel === "gpt4o-mini") {
        aiProvider = "openai";
      }
      
      // Store the provider for future use
      localStorage.setItem("gregify_ai_provider", aiProvider);
      console.log(`Using AI Provider: ${aiProvider} for model: ${selectedModel}`);
      console.log(`Using session ID (user ID): ${sessionId}`);
      
      // NORMAL mode
      console.log("Starting NORMAL mode request...");
      const response = await ApiService.gregifyPromptNormal(
        sessionId,
        prompt,
        selectedModel,
        selectedRole,
        aiProvider
      );
      console.log(
        "NORMAL mode response received, length:",
        response.length
      );

      // Parse the response to separate enhanced prompt and explanation
      const { enhancedPrompt, explanation } = parseNormalResponse(response);
      setNormalResponseParts({ enhancedPrompt, explanation });

      // Send the enhanced prompt to ChatGPT if we're in a Chrome extension
      sendToChatGPT(enhancedPrompt);

      // Set the normal response for display
      setNormalResponse(response);

      setProgress(100);
    } catch (error) {
      console.error("Error in NORMAL mode:", error);
      if (error instanceof Error) {
        setNormalResponse(`Error: ${error.message}`);
      } else {
        setNormalResponse("Error: Failed to get response from AI");
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500); // Keep 100% visible briefly
    }
  };

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800">
        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 left-4 bg-[#FF6B4A] text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm">
            {toastMessage}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium tracking-tight text-white">
              Hi, I'm Greg
            </h2>
            <UserSettings />
          </div>
          <p className="text-sm text-zinc-400">
            Choose your model, role & prompt to get started
          </p>
        </div>

        <div className="space-y-4 mt-6">
          <PromptControls
            selectedModel={selectedModel}
            selectedRole={selectedRole}
            onModelChange={setSelectedModel}
            onRoleChange={setSelectedRole}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Enter Prompt
            </label>
            <Textarea
              placeholder="Type your prompt here..."
              className="min-h-[150px] resize-none bg-[#2C2C30] text-white border-zinc-700 rounded-xl placeholder-zinc-500 focus:border-zinc-500 hover:bg-[#3C3C40] transition-colors"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGregify}
            disabled={isLoading}
            className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20 relative overflow-hidden"
          >
            <span className={isLoading ? "opacity-0" : "opacity-100"}>
              Gregify
            </span>
            {isLoading && (
              <>
                <span className="absolute inset-0 flex items-center justify-center">
                  {Math.round(progress)}%
                </span>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </>
            )}
          </Button>

          {/* NORMAL Mode Response */}
          <>
            {/* Show error message if present */}
            {normalResponse && normalResponse.startsWith("Error:") ? (
              <div className="mt-4 p-4 bg-[#2C2C30] rounded-lg border border-red-700 text-red-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{normalResponse}</p>
                </div>
              </div>
            ) : (
              normalResponse && (
                <div className="mt-4 space-y-4">
                  {/* Enhanced Prompt Card */}
                  {normalResponseParts.enhancedPrompt && (
                    <div className="p-4 bg-[#2C2C30] rounded-lg border-2 border-[#FF6B4A] relative group">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-[#FF6B4A]">
                          Enhanced Prompt
                        </h3>
                        <div className="flex items-center gap-2">
                          <CopyButton
                            textToCopy={normalResponseParts.enhancedPrompt}
                            className="opacity-100 hover:opacity-70"
                          />
                        </div>
                      </div>
                      
                      {/* Prompt content */}
                      <div className="text-sm text-zinc-300 prose prose-invert max-w-none bg-[#252528] p-3 rounded-md border border-zinc-700">
                        <ReactMarkdown>
                          {normalResponseParts.enhancedPrompt}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Copy & Paste Instructions - Less prominent */}
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                        <span>Enhanced prompt automatically sent to ChatGPT</span>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-zinc-700 bg-[#252528] hover:bg-[#303035] text-zinc-300 flex items-center gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(normalResponseParts.enhancedPrompt);
                            showToast("Copied to clipboard! You can paste in ChatGPT if needed.");
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Manual Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* If we have no structured response, show the raw response */}
                  {!normalResponseParts.enhancedPrompt && !normalResponseParts.explanation && (
                    <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700 relative group">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-zinc-300">
                          Response
                        </h3>
                        <CopyButton
                          textToCopy={normalResponse}
                          className="opacity-100 hover:opacity-70"
                        />
                      </div>
                      <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {normalResponse}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Explanation Card - only show if there's explanation content */}
                  {normalResponseParts.explanation && (
                    <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-[#FF6B4A]" />
                        <h3 className="text-sm font-medium text-zinc-300">
                          Explanation
                        </h3>
                      </div>
                      <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {normalResponseParts.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </>
        </div>
      </div>
    </div>
  );
};

export default Index;
