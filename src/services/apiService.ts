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

interface RAGResponse {
  success: boolean;
  response: string;
  error?: string;
}

export class ApiService {
  private static BASE_URL = "https://n8n-fckr.onrender.com/webhook-test";
  private static API_ENDPOINT = "9efe590c-2792-4468-8094-613c55c7ab89";
  private static AGENT_URL = "http://localhost:8000"; // AutoGen backend
  private static RAG_URL = "http://localhost:8000/rag"; // RAG endpoint

  // MAS endpoint
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

  // RAG endpoint
  static async gregifyPromptRAG(
    sessionId: string,
    prompt: string,
    model: ModelType,
    role: AgentRole
  ): Promise<string> {
    try {
      console.log("Making RAG request to:", `${this.RAG_URL}/process-prompt`);

      const response = await fetch(`${this.RAG_URL}/process-prompt`, {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RAGResponse = await response.json();
      console.log("RAG result:", result);

      if (!result.success) {
        throw new Error(result.error || "RAG processing failed");
      }

      return result.response;
    } catch (error) {
      console.error("Error in RAG processing:", error);
      throw error;
    }
  }
}
