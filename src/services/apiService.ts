import { AgentRole, ModelType } from "@/types/agent";
import { AgentService } from "./agentService";

interface GregifyResponse {
  output: string;
}

export class ApiService {
  private static BASE_URL = "https://n8n-fckr.onrender.com/webhook-test";
  private static API_ENDPOINT = "9efe590c-2792-4468-8094-613c55c7ab89";

  static async gregifyPrompt(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole
  ): Promise<GregifyResponse> {
    try {
      // First, process through our agent pipeline
      const agentMessages = await AgentService.processPrompt(
        sessionId,
        prompt,
        role,
        model
      );

      // Get the final evaluated prompt from the last agent
      const finalMessage = agentMessages[agentMessages.length - 1];

      // Send to webhook with agent-enhanced context
      const response = await fetch(`${this.BASE_URL}/${this.API_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer greg",
        },
        body: JSON.stringify({
          sessionId,
          chatInput: `The selected model is ${model}. The task is to take the given prompt and generate a better prompt. Here's the agent-enhanced context:\n\n${agentMessages
            .map((msg) => `${msg.type.toUpperCase()}: ${msg.content}`)
            .join("\n\n")}\n\nOriginal Prompt: ${prompt}`,
          agentMessages, // Include full agent context
        }),
      });

      return (await response.json()) as GregifyResponse;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to get response from AI");
    }
  }
}
