export type AgentType = "critic" | "refiner" | "evaluator" | "complete";

export type AgentRole = "webdev" | "syseng" | "analyst" | "designer";

export type ModelType = "gpt4" | "claude" | "gemini" | "deepseek" | "gpt4o-mini" | "none";

// Commented out MAS and RAG modes, keeping only NORMAL mode
export type Mode = /* "MAS" | "RAG" | */ "NORMAL";

// AI Provider options - used to determine which API to call
export type AIProvider = "deepseek" | "openai";
