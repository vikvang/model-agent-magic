import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
// import { useUser } from "@clerk/clerk-react";
// import { UsageService } from "@/services/usageService";
import { ApiService } from "@/services/apiService";
// import { AuthView } from "@/components/auth/AuthView";
import { PromptControls } from "@/components/prompt/PromptControls";
import { AgentMessages } from "@/components/prompt/AgentMessages";
import { AgentService } from "@/services/agentService";
import { AgentRole, ModelType } from "@/types/agent";

const Index = () => {
  // const { user, isSignedIn } = useUser();
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt4");
  const [selectedRole, setSelectedRole] = useState<AgentRole>("webdev");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [aiResponse, setAiResponse] = useState({
    improvedPrompt: "",
    restOfResponse: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // const checkAuthAndUsage = () => {
  //   if (!isSignedIn) return false;

  //   if (!UsageService.canUseGregify(user)) {
  //     alert(
  //       "You've reached your daily limit of gregifications! Upgrade to Pro for unlimited access."
  //     );
  //     return false;
  //   }

  //   UsageService.incrementUsage(user.id);
  //   return true;
  // };

  const handleGregify = async () => {
    // if (!checkAuthAndUsage()) return;

    setIsProcessing(true);
    try {
      // Process through MAS and RAG
      const response = await ApiService.gregifyPrompt(
        sessionId,
        prompt,
        selectedModel,
        selectedRole
      );

      if (response.success) {
        // Split the RAG response into improved prompt and explanation
        const [improvedPrompt, ...restOfResponse] =
          response.final_prompt.split("\n\n");
        setAiResponse({
          improvedPrompt: improvedPrompt.trim(),
          restOfResponse: restOfResponse.join("\n\n").trim(),
        });
      } else {
        setAiResponse({
          improvedPrompt: "",
          restOfResponse: response.error || "Failed to process prompt",
        });
      }
    } catch (error) {
      setAiResponse({
        improvedPrompt: "",
        restOfResponse: "Error: Failed to get response from AI",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get current agent conversation
  const agentConversation = AgentService.getConversation(sessionId);

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
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Hi, i'm greg
          </h2>
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
            disabled={isProcessing}
            className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Gregify"}
          </Button>

          {/* Show agent conversation messages */}
          {agentConversation?.messages && (
            <AgentMessages
              messages={agentConversation.messages}
              className="mt-6"
            />
          )}

          {/* Show final RAG output */}
          {(aiResponse.improvedPrompt || aiResponse.restOfResponse) && (
            <div className="mt-4">
              {aiResponse.improvedPrompt && (
                <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700 mb-4">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Final Optimized Prompt
                  </h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {aiResponse.improvedPrompt}
                  </p>
                </div>
              )}

              {aiResponse.restOfResponse && (
                <div className="p-4 bg-[#2C2C30] rounded-lg border border-zinc-700">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Additional Context
                  </h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
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
