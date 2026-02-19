import { GoogleGenAI } from "@google/genai";
import { MATH_PROMPT_SCHEMA } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async solveMathProblem(problem: string) {
    try {
      const response = await this.ai.models.generateContent({
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
      const response = await this.ai.models.generateContent({
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
