import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
// import { useUser } from "@clerk/clerk-react";
// import { UsageService } from "@/services/usageService";
import { ApiService } from "@/services/apiService";
// import { AuthView } from "@/components/auth/AuthView";
import { PromptControls } from "@/components/prompt/PromptControls";
import { Check, Copy } from "lucide-react";

const Index = () => {
  // const { user, isSignedIn } = useUser();
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [aiResponse, setAiResponse] = useState({ improvedPrompt: "", restOfResponse: "" });
  const [copied, setCopied] = useState(false);

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

    try {
      const response = await ApiService.gregifyPrompt(sessionId, prompt, selectedModel, selectedAgent);
      const [improvedPrompt, ...restOfResponse] = response.split("\n\n");
      setAiResponse({ 
        improvedPrompt: improvedPrompt.trim(), 
        restOfResponse: restOfResponse.join("\n\n").trim() 
      });
    } catch (error) {
      setAiResponse({ improvedPrompt: "", restOfResponse: "Error: Failed to get response from AI" });
    }
  };

  const handleCopy = async () => {
    // Remove any "Improved Prompt:" text and trim whitespace
    const cleanPrompt = aiResponse.improvedPrompt.replace(/^Improved Prompt:\s*/i, '').trim();
    await navigator.clipboard.writeText(cleanPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            your prompts suck, let me make
          </p>
        </div>

        <div className="space-y-4 mt-6">
          <PromptControls
            selectedModel={selectedModel}
            selectedAgent={selectedAgent}
            onModelChange={setSelectedModel}
            onAgentChange={setSelectedAgent}
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
            className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20"
          >
            Gregify
          </Button>

          {/* Only show response windows if there's content */}
          {aiResponse.improvedPrompt && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {aiResponse.improvedPrompt}
                </p>
              </div>

              <Button
                onClick={handleCopy}
                className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              
              {aiResponse.restOfResponse && (
                <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">
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
