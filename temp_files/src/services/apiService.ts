import { AgentRole, ModelType } from "@/types/agent";
import config from "../config"; // Import the config

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

interface RAGResponse {
  success: boolean;
  response: string;
  error?: string;
}

interface NormalResponse {
  success: boolean;
  response: string;
  error?: string;
}

interface GregifyResponse {
  output: string;
}

export class ApiService {
  private static BASE_URL = "http://localhost:5678/webhook";
  private static API_ENDPOINT = "9efe590c-2792-4468-8094-613c55c7ab89";
  private static AGENT_URL = config.api.baseUrl; // Use config instead of hardcoded URL
  private static RAG_URL = `${config.api.baseUrl}/rag`; // Use config instead of hardcoded URL

  // MAS endpoint - commented out
  /*
  static async gregifyPrompt(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole
  ): Promise<PromptResponse> {
    try {
      // Log origin and request details
      console.log("Extension origin:", window.location.origin);
      console.log("Making request to:", `${this.AGENT_URL}/process-prompt`);

      // First, process through our AutoGen agent pipeline
      const agentResponse = await fetch(`${this.AGENT_URL}/process-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          prompt,
          model,
          role,
        }),
      });

      if (!agentResponse.ok) {
        throw new Error(`HTTP error! status: ${agentResponse.status}`);
      }

      const agentResult = await agentResponse.json();
      console.log("Complete agent result:", agentResult);

      // Add detailed validation of the response
      if (typeof agentResult !== "object") {
        throw new Error("Invalid response format from agent");
      }

      if (!("success" in agentResult)) {
        throw new Error("Missing success field in agent response");
      }

      // If the agent reports failure, throw the error
      if (!agentResult.success) {
        throw new Error(agentResult.error || "Agent processing failed");
      }

      // Validate messages array
      if (!Array.isArray(agentResult.messages)) {
        throw new Error("Invalid messages structure in agent response");
      }

      // Return the processed result
      return {
        success: true,
        messages: agentResult.messages,
        final_prompt: agentResult.final_prompt || "",
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
  */

  // NORMAL mode endpoint
  static async gregifyPromptNormal(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole,
    provider: string = "deepseek" 
  ): Promise<string> {
    try {
      console.log(`Making normal prompt request with provider: ${provider}`);
      const response = await fetch(`${this.AGENT_URL}/normal-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sessionId,
          prompt,
          model,
          role,
          provider,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Normal prompt API success:", data.success);

      if (!data.success) {
        throw new Error(data.error || "Unknown error from API");
      }

      return data.response;
    } catch (error) {
      console.error("Error in normal prompt mode:", error);
      throw error;
    }
  }

  // RAG endpoint - commented out
  /*
  static async gregifyPromptRAG(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole
  ): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/${this.API_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          chatInput: `The selected model is ${model}. The task is to take the given prompt and generate a better prompt. Here's the prompt: ${prompt}`,
        }),
      });

      const data = (await response.json()) as GregifyResponse;
      return data.output;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to get response from AI");
    }
  }
  */
}
