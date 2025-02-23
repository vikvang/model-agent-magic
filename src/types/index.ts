export interface GregifyRequest {
  sessionId: string;
  chatInput: string;
  userId: string;
}

export interface GregifyResponse {
  output: string;
}

export type AIModel = "gpt4" | "claude" | "gemini";
export type AgentType = "webdev" | "syseng" | "analyst" | "designer";

export interface User {
  id: string;
  publicMetadata: {
    plan?: "free" | "paid";
  };
} 