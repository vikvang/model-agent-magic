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
  private static AGENT_URL = "http://localhost:8000"; // AutoGen backend
  private static RAG_URL = "http://localhost:8000/rag"; // RAG endpoint

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
    role: AgentRole
  ): Promise<string> {
    try {
      // Verify our configuration
      console.log("AGENT_URL:", this.AGENT_URL);
      console.log("Making request to:", `${this.AGENT_URL}/normal-prompt`);
      console.log("Using role:", role, "and model:", model);
      console.log("Request payload:", { sessionId, prompt, model, role });

      // First test the health endpoint
      try {
        console.log("Testing health endpoint...");
        const healthResponse = await fetch(`${this.AGENT_URL}/health`, {
          method: "GET",
          // No credentials or headers needed for a GET request
        });

        if (!healthResponse.ok) {
          console.error(
            `Health check failed with status: ${healthResponse.status}`
          );
          const healthText = await healthResponse.text();
          console.error("Health check error:", healthText);
        } else {
          const healthData = await healthResponse.json();
          console.log("Health check successful:", healthData);
        }
      } catch (healthError) {
        console.error("Health check failed:", healthError);
      }

      // Now make the actual request
      console.log("Making normal-prompt request...");
      const response = await fetch(`${this.AGENT_URL}/normal-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // No credentials
        body: JSON.stringify({
          sessionId,
          prompt,
          model,
          role,
        }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers.entries()])
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText) as NormalResponse;
        console.log("Parsed result:", result);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("Normal mode result structure:", Object.keys(result));
      console.log("Result success:", result.success);

      if (!result.success) {
        console.error("API reported failure:", result.error);
        throw new Error(result.error || "Normal processing failed");
      }

      console.log("Success! Response length:", result.response.length);
      return result.response;
    } catch (error) {
      console.error("Error in gregifyPromptNormal:", error);
      console.error("Error info:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack available",
      });
      throw new Error(
        `Failed to get response from AI: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
