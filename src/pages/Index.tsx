import { useState } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { usageService } from "@/services/usageService";
import { apiService } from "@/services/apiService";
import { GregifyForm } from "@/components/GregifyForm";
import { AIModel, AgentType } from "@/types";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<AIModel>("gpt4");
  const [agent, setAgent] = useState<AgentType>("webdev");
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleGregify = async () => {
    if (!isSignedIn || !user) return;
    
    if (!usageService.canUseGregify(user)) {
      alert("You've reached your daily limit of gregifications! Upgrade to Pro for unlimited access.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.gregify({
        sessionId: crypto.randomUUID(),
        chatInput: prompt,
        userId: user.id,
      });

      setAiResponse(response.output);
      usageService.incrementUsage(user.id);
    } catch (error) {
      console.error("Error:", error);
      setAiResponse("Error: Failed to get response from AI");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
        <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800 text-center">
          <h2 className="text-2xl font-medium tracking-tight text-white mb-4">
            Welcome to Greg
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Sign in to start gregifying your prompts
          </p>
          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-[#2C2C30]"
              >
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full bg-[#1C1C1F] rounded-3xl p-6 shadow-xl border border-zinc-800">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Hi, i'm greg
          </h2>
          <p className="text-sm text-zinc-400">
            your prompts suck, let me make
          </p>
        </div>

        <GregifyForm
          model={model}
          agent={agent}
          prompt={prompt}
          onModelChange={setModel}
          onAgentChange={setAgent}
          onPromptChange={setPrompt}
          onSubmit={handleGregify}
          isLoading={isLoading}
        />

        {aiResponse && (
          <div className="mt-4 p-4 bg-[#2C2C30] rounded-xl border border-zinc-700">
            <p className="text-sm text-white whitespace-pre-wrap">
              {aiResponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
