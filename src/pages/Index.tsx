import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { UsageService } from "@/services/usageService";

const Index = () => {
  const { user, isSignedIn } = useUser();
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [aiResponse, setAiResponse] = useState("");


const checkAuthAndUsage = () => {
  if (!isSignedIn) {
    return false;
  }

  if (!UsageService.canUseGregify(user)) {
    alert(
      "You've reached your daily limit of gregifications! Upgrade to Pro for unlimited access."
    );
    return false;
  }

  UsageService.incrementUsage(user.id);
  return true;
};

const handleGregify = async () => {
  // Auth guard
  if (!checkAuthAndUsage()) {
    return;
  }

  try {
    const response = await fetch(
      "https://n8n-fckr.onrender.com/webhook-test/9efe590c-2792-4468-8094-613c55c7ab89",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer greg",
        },
        body: JSON.stringify({
          sessionId,
          chatInput: prompt,
        }),
      }
    );

    const data = await response.json();
    setAiResponse(data.output);
  } catch (error) {
    console.error("Error sending message:", error);
    setAiResponse("Error: Failed to get response from AI");
  }
};
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

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Select Model
            </label>
            <Select onValueChange={setSelectedModel} value={selectedModel}>
              <SelectTrigger className="w-full bg-[#2C2C30] text-white border-zinc-700 rounded-xl hover:bg-[#3C3C40] transition-colors">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C30] border-zinc-700 text-white">
                <SelectItem
                  value="gpt4"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  GPT-4
                </SelectItem>
                <SelectItem
                  value="claude"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  Claude-3.5
                </SelectItem>
                <SelectItem
                  value="gemini"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  Gemini Pro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Select Agent
            </label>
            <Select onValueChange={setSelectedAgent} value={selectedAgent}>
              <SelectTrigger className="w-full bg-[#2C2C30] text-white border-zinc-700 rounded-xl hover:bg-[#3C3C40] transition-colors">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2C30] border-zinc-700 text-white">
                <SelectItem
                  value="webdev"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  Web Developer
                </SelectItem>
                <SelectItem
                  value="syseng"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  System Engineer
                </SelectItem>
                <SelectItem
                  value="analyst"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  Data Analyst
                </SelectItem>
                <SelectItem
                  value="designer"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  UX Designer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {aiResponse && (
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                {aiResponse}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
