import { Button } from "@/components/ui/button";
import { ModelSelect } from "./ModelSelect";
import { AgentSelect } from "./AgentSelect";
import { PromptInput } from "./PromptInput";
import { AIModel, AgentType } from "@/types";

interface GregifyFormProps {
  model: AIModel;
  agent: AgentType;
  prompt: string;
  onModelChange: (model: AIModel) => void;
  onAgentChange: (agent: AgentType) => void;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const GregifyForm = ({
  model,
  agent,
  prompt,
  onModelChange,
  onAgentChange,
  onPromptChange,
  onSubmit,
  isLoading,
}: GregifyFormProps) => {
  return (
    <div className="space-y-4 mt-6">
      <ModelSelect value={model} onChange={onModelChange} />
      <AgentSelect value={agent} onChange={onAgentChange} />
      <PromptInput value={prompt} onChange={onPromptChange} />
      
      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full bg-[#FF6B4A] hover:bg-[#FF8266] text-white transition-all duration-200 rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:shadow-[#FF6B4A]/20"
      >
        {isLoading ? "Gregifying..." : "Gregify"}
      </Button>
    </div>
  );
}; 