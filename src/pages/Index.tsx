
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

  const handleGregify = () => {
    console.log("Gregifying with:", { selectedModel, selectedAgent, prompt });
  };

  return (
    <div className="min-h-screen bg-zinc-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 bg-white rounded-2xl p-8 shadow-lg backdrop-blur-sm border border-zinc-200/50">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-900">
            AI Assistant
          </h2>
          <p className="text-sm text-zinc-500">
            Configure your AI assistant preferences
          </p>
        </div>

        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default Index;

