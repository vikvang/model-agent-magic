export type AgentType = "critic" | "refiner" | "evaluator" | "complete";

export type AgentRole = "webdev" | "syseng" | "analyst" | "designer";

export type ModelType = "gpt4" | "claude" | "gemini" | "deepseek";

// Commented out MAS and RAG modes, keeping only NORMAL mode
export type Mode = /* "MAS" | "RAG" | */ "NORMAL";
