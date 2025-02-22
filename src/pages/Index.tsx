/// <reference types="chrome"/>
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

const Index = () => {
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [aiResponse, setAiResponse] = useState("");

  const handleGregify = async () => {
    if (chrome?.runtime) {
      chrome.runtime.sendMessage({
        type: "GREGIFY",
        data: { selectedModel, selectedAgent, prompt },
      });
    }

    try {
      const response = await fetch(
        "https://n8n-fckr.onrender.com/webhook-test/9efe590c-2792-4468-8094-613c55c7ab89", // MODIFY WITH ACTUAL WEBHOOK URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer greg", // JUST FOR LOCAL DEV
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

  return (
    <div className="min-h-[600px] w-[400px] bg-zinc-50/30 flex items-center justify-center p-4">
      <div className="w-full bg-white rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-zinc-200/50">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
            AI Assistant
          </h2>
          <p className="text-sm text-zinc-500">
            Configure your AI assistant preferences
          </p>
        </div>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Select Model
            </label>
            <Select onValueChange={setSelectedModel} value={selectedModel}>
              <SelectTrigger className="w-full bg-white border-zinc-200">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt4">GPT-4</SelectItem>
                <SelectItem value="claude">Claude-3.5</SelectItem>
                <SelectItem value="gemini">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Select Agent
            </label>
            <Select onValueChange={setSelectedAgent} value={selectedAgent}>
              <SelectTrigger className="w-full bg-white border-zinc-200">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webdev">Web Developer</SelectItem>
                <SelectItem value="syseng">System Engineer</SelectItem>
                <SelectItem value="analyst">Data Analyst</SelectItem>
                <SelectItem value="designer">UX Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Enter Prompt
            </label>
            <Textarea
              placeholder="Type your prompt here..."
              className="min-h-[150px] resize-none bg-white border-zinc-200"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGregify}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all duration-200 shadow-sm"
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
