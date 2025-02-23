import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
// import { useUser } from "@clerk/clerk-react";
// import { UsageService } from "@/services/usageService";
import { ApiService } from "@/services/apiService";
// import { AuthView } from "@/components/auth/AuthView";
import { PromptControls } from "@/components/prompt/PromptControls";

import { AgentMessages } from "@/components/prompt/AgentMessages";
import { AgentService } from "@/services/agentService";
import { AgentRole, ModelType, AgentType } from "@/types/agent";
import { Switch } from "@/components/ui/switch";
import { Check, Copy } from "lucide-react";
type Mode = "MAS" | "RAG";

const Index = () => {
  // const { user, isSignedIn } = useUser();
  // Mode selection
  const [mode, setMode] = useState<Mode>("MAS");

  // Shared state
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt4");
  const [selectedRole, setSelectedRole] = useState<AgentRole>("webdev");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState({ improvedPrompt: "", restOfResponse: "" });
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mode-specific state
  const [masResponse, setMasResponse] = useState("");
  const [ragResponse, setRagResponse] = useState({
    improvedPrompt: "",
    restOfResponse: "",
  });
    
  // Progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && progress < 99) {
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 15;
          const newProgress = prev + increment;
          return newProgress < 99 ? newProgress : 99;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isLoading, progress]);

  const handleGregify = async () => {
    // if (!checkAuthAndUsage()) return;
    setIsLoading(true);
    setProgress(0);
    setAiResponse({ improvedPrompt: "", restOfResponse: "" });
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
      } else {
        // RAG mode
        const response = await ApiService.gregifyPromptRAG(sessionId, prompt, selectedModel, selectedRole);
        const [improvedPrompt, ...restOfResponse] = response.split("\n\n");
        setAiResponse({ 
          improvedPrompt: improvedPrompt.trim(), 
          restOfResponse: restOfResponse.join("\n\n").trim() 
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
      } else {
        setAiResponse({ improvedPrompt: "", restOfResponse: "Error: Failed to get response from AI" });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500); // Keep 100% visible briefly
    }
  };
        
  const handleCopy = async () => {
    // Get the appropriate text based on mode
    const textToCopy = mode === "MAS" 
      ? masResponse 
      : aiResponse.improvedPrompt;
      
    // Remove any "Improved Prompt:" or "Final Optimized Prompt:" text and trim whitespace
    const cleanPrompt = textToCopy.replace(/^(Improved Prompt:|Final Optimized Prompt:)\s*/i, '').trim();
    await navigator.clipboard.writeText(cleanPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get current agent conversation for MAS mode
  const agentConversation =
    mode === "MAS" ? AgentService.getConversation(sessionId) : null;

  // if (!isSignedIn) {
  //   return (
  //     <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
  //       <AuthView />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium tracking-tight text-white">
              Hi, i'm greg
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-400">RAG</span>
              <Switch
                checked={mode === "MAS"}
                onCheckedChange={(checked) => setMode(checked ? "MAS" : "RAG")}
              />
              <span className="text-sm text-zinc-400">MAS</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            your prompts suck, let me make them better
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
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Final Optimized Prompt
                  </h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {masResponse}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 text-[#FF6B4A] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
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

          {/* RAG Mode Response */}
          {mode === "RAG" && aiResponse.improvedPrompt && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-[#2C2C30] rounded-xl border border-zinc-700 relative group">
                <p className="text-sm text-white whitespace-pre-wrap">
                  {aiResponse.improvedPrompt}
                </p>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 text-[#FF6B4A] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {aiResponse.restOfResponse && (
                <div className="p-4 bg-[#2C2C30] rounded-xl border border-zinc-700">
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {aiResponse.restOfResponse}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
