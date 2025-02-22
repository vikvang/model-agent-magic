import { AgentType } from "@/types/agent";
import { cn } from "@/lib/utils";

interface AgentMessage {
  type: AgentType;
  content: string;
  metadata: {
    confidence: number;
    suggestions: string[];
  };
}

interface AgentMessagesProps {
  messages: AgentMessage[];
  className?: string;
}

export const AgentMessages = ({ messages, className }: AgentMessagesProps) => {
  if (!messages?.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message, index) => (
        <div
          key={index}
          className="rounded-lg border border-zinc-700 bg-[#2C2C30] p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">
              {message.type.charAt(0).toUpperCase() + message.type.slice(1)}{" "}
              Agent
            </h3>
            <span className="text-xs text-zinc-400">
              Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-300">{message.content}</p>

          {message.metadata.suggestions?.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-zinc-400">
                Suggestions:
              </h4>
              <ul className="mt-1 space-y-1">
                {message.metadata.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-xs text-zinc-400">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
