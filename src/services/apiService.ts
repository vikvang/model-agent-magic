import { GregifyRequest, GregifyResponse } from "@/types";
import { API_ENDPOINTS } from "@/constants";

export const apiService = {
  gregify: async (request: GregifyRequest): Promise<GregifyResponse> => {
    const response = await fetch(API_ENDPOINTS.GREGIFY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer greg",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to gregify");
    }

    return response.json();
  },
}; 