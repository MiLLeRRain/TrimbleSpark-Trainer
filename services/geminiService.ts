
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Difficulty, EvaluationResponse, GeneratedExerciseResponse, PointCloudTopic } from "../types";
import { getAnyApiKey, getNextApiKey, getSelectedModel } from "./apiKeyStore";

const DEFAULT_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const SYSTEM_INSTRUCTION = `
You are a Senior Data Engineer at Trimble Inc. and a PySpark expert. 
Your goal is to train junior engineers in PySpark syntax and logic.
You specialize in 3D Point Cloud data (LiDAR), Geospatial data, and Construction Telematics.

CRITICAL FORMATTING RULES:
1. Respond ONLY with valid JSON.
2. The "standardSolution" MUST be formatted as high-quality, readable Python code following PEP8.
3. The "inputSchema" MUST be indented for readability.
4. The "sampleData" MUST be a valid JSON array.
5. The "expectedOutputExample" MUST represent the FINAL 'result_df' after the logic is applied.
   - TRANSFORMATION PRINCIPLE: Show the result of processing. If it's aggregation, show aggregated rows.
   - ALIGNMENT RULE: The table MUST be a PERFECTLY ALIGNED ASCII table (like Spark's .show()). 
   - Every column must use spaces to ensure vertical bars '|' align perfectly across all rows.
6. DO NOT use semicolons (;) to combine multiple lines into one.
`;

/**
 * Handle platform specific key errors by notifying the UI
 */
const handleApiError = (e: any) => {
  if (
    e?.message?.includes("Requested entity was not found") ||
    e?.message?.includes("Missing Gemini API key")
  ) {
    window.dispatchEvent(new CustomEvent("gemini:keyError"));
  }
  throw e;
};

const resolveApiKey = () => {
  const key = getNextApiKey() || (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing Gemini API key. Add one in the sidebar.");
  }
  return key;
};

const resolveModel = () => getSelectedModel() || DEFAULT_MODELS[0];

const normalizeModelName = (name: string) => name.replace(/^models\//, "");

export const listAvailableModels = async (): Promise<string[]> => {
  const apiKey = getAnyApiKey() || (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (!apiKey) return DEFAULT_MODELS;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const pager = await ai.models.list({ config: { pageSize: 100 } });
    const models = pager.page
      .map((model) => (model.name ? normalizeModelName(model.name) : ""))
      .filter((name) => name.length > 0);

    const unique = Array.from(new Set(models));
    return unique.length > 0 ? unique : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
};

export const generateExercise = async (
  category: Category,
  difficulty: Difficulty,
  topic?: string
): Promise<GeneratedExerciseResponse> => {
  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  
  let specificContext = "";
  if (category === Category.POINT_CLOUD) {
    specificContext = `Focus on LiDAR processing for Construction. Schema: (x, y, z, intensity, classification).`;
    if (topic && topic !== PointCloudTopic.MIXED) {
      specificContext += ` MANDATORY TOPIC: "${topic}".`;
    }
  }

  const prompt = `Create a specialized PySpark coding exercise. Category: ${category}. Difficulty: ${difficulty}. ${specificContext}. 
  
  MANDATORY: The 'expectedOutputExample' MUST be a perfectly aligned ASCII table. Ensure all characters are spaced such that vertical columns match up exactly.`;

  try {
    const response = await ai.models.generateContent({
      model: resolveModel(),
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            inputSchema: { type: Type.STRING },
            sampleData: { type: Type.STRING },
            expectedOutputDescription: { type: Type.STRING },
            expectedOutputExample: { type: Type.STRING },
            standardSolution: { type: Type.STRING }
          },
          required: ["title", "description", "inputSchema", "sampleData", "expectedOutputDescription", "expectedOutputExample", "standardSolution"]
        }
      }
    });

    if (response.text) return JSON.parse(response.text.trim()) as GeneratedExerciseResponse;
    throw new Error("Empty response from AI");
  } catch (e) {
    return handleApiError(e);
  }
};

export const evaluateSubmission = async (
  exercise: GeneratedExerciseResponse,
  userCode: string
): Promise<EvaluationResponse> => {
  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  const prompt = `Review this PySpark code. Problem: ${exercise.description}. Solution: ${exercise.standardSolution}. User Code: ${userCode}`;
  
  try {
    const response = await ai.models.generateContent({
      model: resolveModel(),
      contents: prompt,
      config: {
        systemInstruction: "You are a Senior Code Reviewer at Trimble. Respond ONLY in JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });
    if (response.text) return JSON.parse(response.text.trim()) as EvaluationResponse;
    return { isCorrect: false, feedback: "Evaluation failed." };
  } catch (e) {
    return handleApiError(e);
  }
};
