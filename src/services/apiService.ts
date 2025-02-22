import { AgentRole, ModelType } from "@/types/agent";

interface AgentMessage {
  type: string;
  content: string;
  metadata: {
    confidence: number;
    suggestions: string[];
    role: AgentRole;
    model: ModelType;
  };
}

interface PromptResponse {
  success: boolean;
  messages: AgentMessage[];
  final_prompt: string;
  error?: string;
}

export class ApiService {
  private static BASE_URL = "https://n8n-fckr.onrender.com/webhook-test";
  private static API_ENDPOINT = "9efe590c-2792-4468-8094-613c55c7ab89";
  private static AGENT_URL = "http://localhost:8000"; // AutoGen backend

  static async gregifyPrompt(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole
  ): Promise<PromptResponse> {
    try {
      // First, process through our AutoGen agent pipeline
      const agentResponse = await fetch(`${this.AGENT_URL}/process-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          prompt,
          model,
          role,
        }),
      });

      const agentResult = await agentResponse.json();

      // Handle errors from the agent pipeline
      if (!agentResult.success) {
        throw new Error(agentResult.error || "Agent processing failed");
      }

      // Then send to the webhook with the agent-enhanced prompt
      const webhookResponse = await fetch(
        `${this.BASE_URL}/${this.API_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer greg",
          },
          body: JSON.stringify({
            sessionId,
            chatInput: agentResult.final_prompt,
          }),
        }
      );

      const webhookResult = await webhookResponse.json();

      // Return the combined results
      return {
        success: true,
        messages: agentResult.messages || [],
        final_prompt: webhookResult.output || agentResult.message || "",
        error: undefined,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        messages: [],
        final_prompt: "",
        error:
          error instanceof Error
            ? error.message
            : "Failed to get response from AI",
      };
    }
  }
}
