import { AgentRole, AgentType, ModelType } from "@/types/agent";

interface AgentMessage {
  type: AgentType;
  content: string;
  metadata: {
    confidence: number;
    suggestions: string[];
    role: AgentRole;
    model: ModelType;
  };
}

interface AgentConversation {
  sessionId: string;
  messages: AgentMessage[];
  currentState: AgentType;
}

export class AgentService {
  private static conversations = new Map<string, AgentConversation>();

  private static initializeConversation(
    sessionId: string,
    role: AgentRole,
    model: ModelType
  ): AgentConversation {
    const conversation: AgentConversation = {
      sessionId,
      messages: [],
      currentState: "critic",
    };
    this.conversations.set(sessionId, conversation);
    return conversation;
  }

  private static async processCriticAgent(
    prompt: string,
    role: AgentRole,
    model: ModelType
  ): Promise<AgentMessage> {
    // Initial implementation of the Critic agent
    const message: AgentMessage = {
      type: "critic",
      content: `Analyzing prompt: "${prompt}" for ${role} role using ${model}`,
      metadata: {
        confidence: 0.8,
        suggestions: [
          "Check for technical accuracy",
          "Ensure role-specific requirements",
          "Validate clarity and specificity",
        ],
        role,
        model,
      },
    };
    return message;
  }

  private static async processRefinerAgent(
    criticMessage: AgentMessage
  ): Promise<AgentMessage> {
    // Initial implementation of the Refiner agent
    const message: AgentMessage = {
      type: "refiner",
      content: `Refining based on critic's feedback: ${criticMessage.content}`,
      metadata: {
        confidence: 0.85,
        suggestions: [
          "Applied technical improvements",
          "Enhanced role-specific elements",
          "Improved clarity",
        ],
        role: criticMessage.metadata.role,
        model: criticMessage.metadata.model,
      },
    };
    return message;
  }

  private static async processEvaluatorAgent(
    refinerMessage: AgentMessage
  ): Promise<AgentMessage> {
    // Initial implementation of the Evaluator agent
    const message: AgentMessage = {
      type: "evaluator",
      content: `Evaluating refined prompt: ${refinerMessage.content}`,
      metadata: {
        confidence: 0.9,
        suggestions: [
          "Meets technical standards",
          "Aligns with role requirements",
          "Ready for RAG pipeline",
        ],
        role: refinerMessage.metadata.role,
        model: refinerMessage.metadata.model,
      },
    };
    return message;
  }

  static async processPrompt(
    sessionId: string,
    prompt: string,
    role: AgentRole,
    model: ModelType
  ): Promise<AgentMessage[]> {
    let conversation =
      this.conversations.get(sessionId) ||
      this.initializeConversation(sessionId, role, model);

    // Process through agent pipeline
    const criticMessage = await this.processCriticAgent(prompt, role, model);
    conversation.messages.push(criticMessage);
    conversation.currentState = "refiner";

    const refinerMessage = await this.processRefinerAgent(criticMessage);
    conversation.messages.push(refinerMessage);
    conversation.currentState = "evaluator";

    const evaluatorMessage = await this.processEvaluatorAgent(refinerMessage);
    conversation.messages.push(evaluatorMessage);
    conversation.currentState = "complete";

    // Update conversation in memory
    this.conversations.set(sessionId, conversation);

    return conversation.messages;
  }

  static getConversation(sessionId: string): AgentConversation | undefined {
    return this.conversations.get(sessionId);
  }
}
