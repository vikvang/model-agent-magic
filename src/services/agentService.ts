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

interface RawAgentResponse {
  type?: string;
  content?: string;
  message?: string;
  metadata?: any;
  clarity_score?: number;
  technical_accuracy_score?: number;
  role_alignment_score?: number;
  issues?: Array<{ type: string; description: string; suggestion: string }>;
  overall_assessment?: string;
  refined_prompt?: string;
  improvements?: Array<{
    original_issue: string;
    how_addressed: string;
    impact: string;
  }>;
  technical_enhancements?: Array<{ aspect: string; enhancement: string }>;
  confidence_assessment?: {
    clarity_improvement: number;
    technical_accuracy_improvement: number;
    role_alignment_improvement: number;
  };
  evaluation_scores?: {
    clarity: number;
    technical_accuracy: number;
    role_alignment: number;
    improvement_impact: number;
  };
  validation_checks?: Array<{
    aspect: string;
    passed: boolean;
    comment: string;
  }>;
  final_verdict?: {
    approved: boolean;
    reasoning: string;
    suggestions_if_not_approved: string[];
  };
  final_prompt?: string;
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

  static updateConversation(
    sessionId: string,
    conversation: AgentConversation
  ): void {
    this.conversations.set(sessionId, conversation);
  }

  static transformAgentResponse(
    rawResponse: RawAgentResponse,
    agentType: AgentType
  ): AgentMessage {
    let content = "";
    let confidence = 0;
    let suggestions: string[] = [];

    // If rawResponse is a string, try to parse it as JSON
    let response = rawResponse;
    if (typeof rawResponse === "string") {
      try {
        response = JSON.parse(rawResponse);
      } catch (e) {
        console.error(`Failed to parse response for ${agentType}:`, e);
        return {
          type: agentType,
          content: "Error: Invalid response format",
          metadata: {
            confidence: 0,
            suggestions: [],
            role: "webdev",
            model: "gpt4",
          },
        };
      }
    }

    // For all agent responses, we need to parse the content if it contains JSON
    if (typeof response.content === "string") {
      try {
        // Try to find and parse the JSON object within the content
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[1]);
          console.log(`Extracted ${agentType} content:`, parsedContent);

          switch (agentType) {
            case "critic":
              if (parsedContent.overall_assessment) {
                response = {
                  ...response,
                  overall_assessment: parsedContent.overall_assessment,
                  clarity_score: parsedContent.clarity_score,
                  technical_accuracy_score:
                    parsedContent.technical_accuracy_score,
                  role_alignment_score: parsedContent.role_alignment_score,
                  issues: parsedContent.issues,
                };
              }
              break;
            case "refiner":
              if (parsedContent.refined_prompt) {
                response = {
                  ...response,
                  refined_prompt: parsedContent.refined_prompt,
                  improvements: parsedContent.improvements,
                  technical_enhancements: parsedContent.technical_enhancements,
                  confidence_assessment: parsedContent.confidence_assessment,
                };
              }
              break;
            case "evaluator":
              if (parsedContent.final_prompt) {
                response = {
                  ...response,
                  final_prompt: parsedContent.final_prompt,
                  evaluation_scores: parsedContent.evaluation_scores,
                  validation_checks: parsedContent.validation_checks,
                  final_verdict: parsedContent.final_verdict,
                };
              }
              break;
          }
        }
      } catch (e) {
        console.error(`Failed to parse ${agentType} JSON content:`, e);
      }
    }

    switch (agentType) {
      case "critic":
        // Calculate average confidence from scores
        confidence =
          ((response.clarity_score || 0) +
            (response.technical_accuracy_score || 0) +
            (response.role_alignment_score || 0)) /
          3;

        // For critic, we specifically want the overall_assessment
        content = response.overall_assessment || "No assessment provided";

        // Extract suggestions from issues
        suggestions = (response.issues || []).map((issue) => issue.suggestion);
        break;

      case "refiner":
        // Get confidence from confidence assessment
        const confidenceAssessment = response.confidence_assessment || {
          clarity_improvement: 0,
          technical_accuracy_improvement: 0,
          role_alignment_improvement: 0,
        };
        confidence =
          (confidenceAssessment.clarity_improvement +
            confidenceAssessment.technical_accuracy_improvement +
            confidenceAssessment.role_alignment_improvement) /
          3;

        // For refiner, we specifically want the refined_prompt
        content = response.refined_prompt || "No refinements provided";

        // Combine suggestions from improvements and technical enhancements
        suggestions = [
          ...(response.improvements || []).map(
            (imp) => `${imp.original_issue} → ${imp.how_addressed}`
          ),
          ...(response.technical_enhancements || []).map(
            (enh) => `${enh.aspect}: ${enh.enhancement}`
          ),
        ];
        break;

      case "evaluator":
        // Get confidence from evaluation scores
        const evalScores = response.evaluation_scores || {
          clarity: 0,
          technical_accuracy: 0,
          role_alignment: 0,
          improvement_impact: 0,
        };
        confidence =
          (evalScores.clarity +
            evalScores.technical_accuracy +
            evalScores.role_alignment +
            evalScores.improvement_impact) /
          4;

        // For evaluator, we specifically want the final_prompt
        content = response.final_prompt || "No final prompt generated";

        // Get suggestions from validation checks and final verdict
        suggestions = [
          ...(response.validation_checks || [])
            .filter((check) => !check.passed)
            .map((check) => `${check.aspect}: ${check.comment}`),
          ...(response.final_verdict?.suggestions_if_not_approved || []),
        ];
        break;

      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    return {
      type: agentType,
      content,
      metadata: {
        confidence,
        suggestions,
        role: response.metadata?.role || "webdev",
        model: response.metadata?.model || "gpt4",
      },
    };
  }
}
