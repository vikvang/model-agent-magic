import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentRole, ModelType } from "@/types/agent";

interface PromptControlsProps {
  selectedModel: ModelType;
  selectedRole: AgentRole;
  onModelChange: (value: ModelType) => void;
  onRoleChange: (value: AgentRole) => void;
}

export const PromptControls = ({
  selectedModel,
  selectedRole,
  onModelChange,
  onRoleChange,
}: PromptControlsProps) => {
  const [preferredProvider, setPreferredProvider] = useState<string>("deepseek");

  // Load saved AI provider preference on mount and when it changes
  useEffect(() => {
    const savedProvider = localStorage.getItem("gregify_ai_provider");
    if (savedProvider) {
      setPreferredProvider(savedProvider);
      
      // Auto-select the default model for the preferred provider
      if (savedProvider === "openai" && selectedModel !== "gpt4o-mini") {
        onModelChange("gpt4o-mini");
      } else if (savedProvider === "deepseek" && selectedModel !== "deepseek") {
        onModelChange("deepseek");
      }
    }
  }, [preferredProvider, selectedModel, onModelChange]);

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Select Model
        </label>
        <Select onValueChange={onModelChange} value={selectedModel}>
          <SelectTrigger className="w-full bg-[#2C2C30] text-white border-zinc-700 rounded-xl hover:bg-[#3C3C40] transition-colors">
            <SelectValue placeholder="Choose a model" />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C30] border-zinc-700 text-white">
            {preferredProvider === "openai" && (
              <SelectItem
                value="gpt4o-mini"
                className="text-white focus:text-white focus:bg-[#3C3C40]"
              >
                GPT-4o mini
              </SelectItem>
            )}
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
            {preferredProvider === "deepseek" && (
              <SelectItem
                value="deepseek"
                className="text-white focus:text-white focus:bg-[#3C3C40]"
              >
                DeepSeek Chat
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Select Role</label>
        <Select onValueChange={onRoleChange} value={selectedRole}>
          <SelectTrigger className="w-full bg-[#2C2C30] text-white border-zinc-700 rounded-xl hover:bg-[#3C3C40] transition-colors">
            <SelectValue placeholder="Choose a role" />
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
    </>
  );
};
