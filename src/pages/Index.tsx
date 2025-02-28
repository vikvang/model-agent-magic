import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from "react";
import { ApiService } from "@/services/apiService";
import { PromptControls } from "@/components/prompt/PromptControls";
import ReactMarkdown from "react-markdown";
import { CopyButton } from "@/components/ui/copy-button";
import { Info, AlertCircle } from "lucide-react";

import { AgentMessages } from "@/components/prompt/AgentMessages";
import { AgentService } from "@/services/agentService";
import { AgentRole, ModelType, AgentType, Mode } from "@/types/agent";
import { Switch } from "@/components/ui/switch";

const Index = () => {
  // Mode selection
  const [mode, setMode] = useState<Mode>("MAS");

  // Shared state
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt4");
  const [selectedRole, setSelectedRole] = useState<AgentRole>("webdev");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState({
    improvedPrompt: "",
    restOfResponse: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mode-specific state
  const [masResponse, setMasResponse] = useState("");
  const [normalResponse, setNormalResponse] = useState("");
  const [ragResponse, setRagResponse] = useState({
    improvedPrompt: "",
    restOfResponse: "",
  });

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
    // Try to find the enhanced prompt section first with a specific pattern
    const enhancedPromptMatch = response.match(
      /Enhanced prompt:[\s"]*(.+?)["]*(?:\n\n|\n(?=Explanation:|-))/is
    );

    let enhancedPrompt = "";
    let explanation = "";

    if (enhancedPromptMatch && enhancedPromptMatch[1]) {
      enhancedPrompt = enhancedPromptMatch[1].trim();

      // Find start of explanation (after the enhanced prompt)
      const promptEndIndex =
        response.indexOf(enhancedPromptMatch[0]) +
        enhancedPromptMatch[0].length;
      explanation = response.substring(promptEndIndex).trim();
    } else {
      // Fallback: if regex doesn't match, use some heuristics
      const lines = response.split("\n");

      // Find the first line that contains "Enhanced prompt:"
      const enhancedPromptLine = lines.findIndex((line) =>
        line.toLowerCase().includes("enhanced prompt:")
      );

      if (enhancedPromptLine >= 0) {
        // Extract everything after "Enhanced prompt:" on this line
        const promptText = lines[enhancedPromptLine]
          .replace(/^.*?Enhanced prompt:[\s"]*/i, "")
          .trim();

        // Look for the next few lines until we find explanation section
        let endOfPrompt = lines.findIndex(
          (line, index) =>
            index > enhancedPromptLine &&
            (line.toLowerCase().includes("explanation:") || line.match(/^-+$/))
        );

        if (endOfPrompt === -1) {
          // If no clear separator, assume the prompt is just this line
          enhancedPrompt = promptText;
          explanation = lines
            .slice(enhancedPromptLine + 1)
            .join("\n")
            .trim();
        } else {
          // If we found a separator, the prompt might span multiple lines
          if (promptText) {
            // If there's text on the same line as "Enhanced prompt:"
            enhancedPrompt = promptText;
          } else {
            // If "Enhanced prompt:" is on its own line, take lines until the separator
            enhancedPrompt = lines
              .slice(enhancedPromptLine + 1, endOfPrompt)
          .join("\n")
          .trim();
          }
        explanation = lines.slice(endOfPrompt).join("\n").trim();
        }
      } else {
        // If we can't find any structure, just return the whole thing as explanation
        explanation = response;
      }
    }

    return { enhancedPrompt, explanation };
  }, []);

  // Function to send enhanced prompt to ChatGPT
  const sendToChatGPT = useCallback((enhancedPrompt: string) => {
    console.log("Sending enhanced prompt to ChatGPT:", enhancedPrompt);

    // Check if chrome runtime is available (we're in a Chrome extension)
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          action: "enhancedPromptReady",
          enhancedPrompt,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
          } else {
            console.log("Message sent successfully:", response);
          }
        }
      );
    } else {
      console.warn(
        "Chrome runtime not available, not sending prompt to ChatGPT"
      );
    }
  }, []);

  const handleGregify = async () => {
    setIsLoading(true);
    setProgress(0);
    setAiResponse({ improvedPrompt: "", restOfResponse: "" });
    // Clear normal response parts too
    setNormalResponseParts({ enhancedPrompt: "", explanation: "" });
    setIsProcessing(true);
    try {
      if (mode === "MAS") {
        const response = await ApiService.gregifyPrompt(
          sessionId,
          prompt,
          selectedModel,
          selectedRole
        );

        // Transform raw responses into AgentMessage format
        if (response.messages && response.messages.length > 0) {
          const transformedMessages = response.messages.map((msg) =>
            AgentService.transformAgentResponse(msg, msg.type as AgentType)
          );

          // Find the evaluator's message to get the final prompt
          const evaluatorMessage = transformedMessages.find(
            (msg) => msg.type === "evaluator"
          );

          // Update the agent conversation in the AgentService
          AgentService.updateConversation(sessionId, {
            sessionId,
            messages: transformedMessages,
            currentState: "complete",
          });

          // Set the final prompt from the evaluator's content
          setMasResponse(
            evaluatorMessage?.content || "No optimized prompt generated"
          );
        } else {
          setMasResponse("No response from agents");
          AgentService.updateConversation(sessionId, {
            sessionId,
            messages: [],
            currentState: "complete",
          });
        }
      } else if (mode === "NORMAL") {
        // NORMAL mode
        try {
          console.log("Starting NORMAL mode request...");
          const response = await ApiService.gregifyPromptNormal(
            sessionId,
            prompt,
            selectedModel,
            selectedRole
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
        }
      } else {
        // RAG mode
        const response = await ApiService.gregifyPromptRAG(
          sessionId,
          prompt,
          selectedModel,
          selectedRole
        );
        const [improvedPrompt, ...restOfResponse] = response.split("\n\n");
        setAiResponse({
          improvedPrompt: improvedPrompt.trim(),
          restOfResponse: restOfResponse.join("\n\n").trim(),
        });
        setProgress(100);
      }
    } catch (error) {
      if (mode === "MAS") {
        setMasResponse("Error: Failed to get response from AI");
        // Clear the agent conversation on error
        AgentService.updateConversation(sessionId, {
          sessionId,
          messages: [],
          currentState: "complete",
        });
      } else if (mode === "NORMAL") {
        setNormalResponse("Error: Failed to get response from AI");
      } else {
        setAiResponse({
          improvedPrompt: "",
          restOfResponse: "Error: Failed to get response from AI",
        });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500); // Keep 100% visible briefly
    }
  };

  // Get current agent conversation for MAS mode
  const agentConversation =
    mode === "MAS" ? AgentService.getConversation(sessionId) : null;

  // Helper for changing the mode
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium tracking-tight text-white">
              Hi, I'm Greg
            </h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center rounded-lg bg-[#2C2C30] p-1">
                <button
                  onClick={() => handleModeChange("NORMAL")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mode === "NORMAL"
                      ? "bg-[#FF6B4A] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => handleModeChange("RAG")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mode === "RAG"
                      ? "bg-[#FF6B4A] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  RAG
                </button>
                <button
                  onClick={() => handleModeChange("MAS")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    mode === "MAS"
                      ? "bg-[#FF6B4A] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  MAS
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Choose your mode, model, role & prompt to get started
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

          {/* MAS Mode Response */}
          {mode === "MAS" && (
            <>
              {masResponse && (
                <div className="mt-4 p-4 bg-[#2C2C30] rounded-lg border border-zinc-700 relative group">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Final Optimized Prompt
                    </h3>
                    <CopyButton
                      textToCopy={masResponse
                        .replace(
                          /^(Improved Prompt:|Final Optimized Prompt:|Enhanced prompt for.*?role:)\s*/i,
                          ""
                        )
                        .trim()}
                      className="opacity-100 hover:opacity-70"
                    />
                  </div>
                  <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                    <ReactMarkdown>{masResponse}</ReactMarkdown>
                  </div>
                </div>
              )}
              {agentConversation?.messages && (
                <AgentMessages
                  messages={agentConversation.messages}
                  className="mt-6"
                />
              )}
            </>
          )}

          {/* NORMAL Mode Response */}
          {mode === "NORMAL" && (
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
                    <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700 relative group">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-zinc-300">
                          Enhanced Prompt
                        </h3>
                        <CopyButton
                          textToCopy={
                            normalResponseParts.enhancedPrompt || normalResponse
                          }
                          className="opacity-100 hover:opacity-70"
                        />
                      </div>
                      <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {normalResponseParts.enhancedPrompt || normalResponse}
                        </ReactMarkdown>
                      </div>
                    </div>

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
          )}

          {/* RAG Mode Response */}
          {mode === "RAG" && (
            <>
              {aiResponse.improvedPrompt && (
                <div className="mt-4 space-y-4">
                  {/* Improved Prompt Card */}
                  <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700 relative group">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-zinc-300">
                        Improved Prompt
                      </h3>
                      <CopyButton
                        textToCopy={aiResponse.improvedPrompt}
                        className="opacity-100 hover:opacity-70"
                      />
                    </div>
                    <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                      <ReactMarkdown>{aiResponse.improvedPrompt}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Explanation Card */}
                  {aiResponse.restOfResponse && (
                    <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-[#FF6B4A]" />
                        <h3 className="text-sm font-medium text-zinc-300">
                          Explanation
                        </h3>
                      </div>
                      <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {aiResponse.restOfResponse}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
