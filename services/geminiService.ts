
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Difficulty, EvaluationResponse, GeneratedExerciseResponse, PointCloudTopic } from "../types";

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

export const generateExercise = async (
  category: Category,
  difficulty: Difficulty,
  topic?: string
): Promise<GeneratedExerciseResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let specificContext = "";
  if (category === Category.POINT_CLOUD) {
    specificContext = `Focus on LiDAR processing for Construction. Schema: (x, y, z, intensity, classification).`;
    if (topic && topic !== PointCloudTopic.MIXED) {
      specificContext += ` MANDATORY TOPIC: "${topic}".`;
    }
  }

  const prompt = `Create a specialized PySpark coding exercise. Category: ${category}. Difficulty: ${difficulty}. ${specificContext}. 
  
  MANDATORY: The 'expectedOutputExample' MUST be a perfectly aligned ASCII table. Ensure all characters are spaced such that vertical columns match up exactly.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
};

export const evaluateSubmission = async (
  exercise: GeneratedExerciseResponse,
  userCode: string
): Promise<EvaluationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Review this PySpark code. Problem: ${exercise.description}. Solution: ${exercise.standardSolution}. User Code: ${userCode}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
};
