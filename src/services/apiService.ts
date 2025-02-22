interface GregifyResponse {
  output: string;
}

export class ApiService {
  private static BASE_URL = "https://n8n-fckr.onrender.com/webhook-test";
  private static API_ENDPOINT = "9efe590c-2792-4468-8094-613c55c7ab89";

  static async gregifyPrompt(
    sessionId: string,
    prompt: string,
    model: string,
    agent: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.BASE_URL}/${this.API_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer greg",
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
}
