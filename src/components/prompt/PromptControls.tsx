import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentRole, ModelType, AIProvider } from "@/types/agent";
import { supabase } from "@/lib/supabase";
import { useStateWithStorage } from "@/hooks/useStateWithStorage";

interface PromptControlsProps {
  selectedModel: ModelType;
  selectedRole: AgentRole;
  onModelChange: (value: ModelType) => void;
  onRoleChange: (value: AgentRole) => void;
}

interface UserApiKeys {
  openai_api_key?: string | null;
  deepseek_api_key?: string | null;
}

export const PromptControls = ({
  selectedModel,
  selectedRole,
  onModelChange,
  onRoleChange,
}: PromptControlsProps) => {
  const [userApiKeys, setUserApiKeys] = useState<UserApiKeys>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeProvider, setActiveProvider] =
    useStateWithStorage<AIProvider | null>("gregify_active_provider", null);

  // Load user API keys and set active provider
  useEffect(() => {
    // Fetch user API keys from Supabase
    const fetchUserApiKeys = async () => {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found");
          setLoading(false);
          return;
        }

        // Get API keys
        const { data, error } = await supabase
          .from("user_api_keys")
          .select("openai_api_key, deepseek_api_key")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching API keys:", error);
        } else if (data) {
          setUserApiKeys(data);

          // Determine active provider
          const hasOpenAI = !!data.openai_api_key;
          const hasDeepSeek = !!data.deepseek_api_key;

          if (hasOpenAI) {
            setActiveProvider("openai");
          } else if (hasDeepSeek) {
            setActiveProvider("deepseek");
          } else {
            setActiveProvider(null);
          }
        }
      } catch (error) {
        console.error("Error in fetchUserApiKeys:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserApiKeys();
  }, [setActiveProvider]);

  // Update model when active provider changes
  useEffect(() => {
    // When provider changes, update the model selection
    if (activeProvider === "openai") {
      // Only update if the current model is not an OpenAI model
      if (selectedModel !== "gpt4" && selectedModel !== "gpt4o-mini") {
        onModelChange("gpt4");
      }
    } else if (activeProvider === "deepseek") {
      if (selectedModel !== "deepseek") {
        onModelChange("deepseek");
      }
    } else {
      onModelChange("none");
    }
  }, [activeProvider, selectedModel, onModelChange]);

  // Check if OpenAI models should be shown
  const hasOpenAIKey = !!userApiKeys.openai_api_key;

  // Check if DeepSeek models should be shown
  const hasDeepSeekKey = !!userApiKeys.deepseek_api_key;

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Available Models
        </label>
        <Select
          onValueChange={onModelChange}
          value={selectedModel}
          disabled={loading || (!hasOpenAIKey && !hasDeepSeekKey)}
        >
          <SelectTrigger className="w-full bg-[#2C2C30] text-white border-zinc-700 rounded-xl hover:bg-[#3C3C40] transition-colors">
            <SelectValue
              placeholder={loading ? "Loading models..." : "Choose a model"}
            />
          </SelectTrigger>
          <SelectContent className="bg-[#2C2C30] border-zinc-700 text-white">
            {hasOpenAIKey && (
              <>
                <SelectItem
                  value="gpt4"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  OpenAI GPT-4
                </SelectItem>
                <SelectItem
                  value="gpt4o-mini"
                  className="text-white focus:text-white focus:bg-[#3C3C40]"
                >
                  OpenAI GPT-4o Mini
                </SelectItem>
              </>
            )}
            {hasDeepSeekKey && (
              <SelectItem
                value="deepseek"
                className="text-white focus:text-white focus:bg-[#3C3C40]"
              >
                DeepSeek Chat
              </SelectItem>
            )}
            {!loading && !hasOpenAIKey && !hasDeepSeekKey && (
              <SelectItem
                value="none"
                className="text-red-400 focus:text-red-400 focus:bg-[#3C3C40]"
                disabled
              >
                No API keys configured
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 mt-4">
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
