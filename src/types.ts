import { Type } from "@google/genai";

export interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  isAiGenerated?: boolean;
  explanation?: string;
}

export const MATH_PROMPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    result: {
      type: Type.STRING,
      description: "The final numerical result of the calculation.",
    },
    explanation: {
      type: Type.STRING,
      description: "A step-by-step explanation of how the result was reached.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of individual steps taken to solve the problem.",
    }
  },
  required: ["result", "explanation"],
};
