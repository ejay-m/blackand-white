import { GoogleGenAI } from "@google/genai";
import { MATH_PROMPT_SCHEMA } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getAI() {
    if (this.ai) return this.ai;
    
    const apiKey = localStorage.getItem('gemini-api-key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please set it in Settings.");
    }
    
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  async solveMathProblem(problem: string) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Solve this math problem: ${problem}. Provide a clear result and a step-by-step explanation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: MATH_PROMPT_SCHEMA,
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to solve the problem. Please try again.");
    }
  }

  async explainCalculation(expression: string, result: string) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain how to calculate ${expression} which equals ${result}. Break it down into simple steps.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: MATH_PROMPT_SCHEMA,
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate explanation.");
    }
  }
}

export const geminiService = new GeminiService();
