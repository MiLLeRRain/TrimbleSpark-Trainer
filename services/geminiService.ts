import { GoogleGenAI, Type } from "@google/genai";
import { Category, Difficulty, EvaluationResponse, GeneratedExerciseResponse } from "../types";

// Helper to get the AI client
const getAIClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `
You are a Senior Data Engineer at Trimble Inc. and a PySpark expert. 
Your goal is to train junior engineers in PySpark syntax and logic.
You specialize in 3D Point Cloud data (LiDAR), Geospatial data, and Construction Telematics.
IMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks.
`;

export const generateExercise = async (
  category: Category,
  difficulty: Difficulty,
  apiKey: string
): Promise<GeneratedExerciseResponse> => {
  
  let specificContext = "";
  switch (category) {
    case Category.POINT_CLOUD:
      specificContext = "Focus on DataFrame operations involving LIDAR points (x, y, z, intensity, class_id). Scenarios: Noise filtering, coordinate transformation, voxel grid aggregation.";
      break;
    case Category.GEOSPATIAL:
      specificContext = "Focus on lat/lon, WKT strings, spatial joins (e.g., points in polygons), geohashing, or calculating distances between assets.";
      break;
    case Category.TELEMATICS:
      specificContext = "Focus on time-series data from heavy machinery (excavators, dozers). Window functions, sessionization, calculating engine hours, fuel burn rates.";
      break;
    case Category.ASSET_MGMT:
      specificContext = "Focus on joining equipment lists with project data, handling nested JSON schemas common in equipment status logs, pivoting data.";
      break;
  }

  const prompt = `
    Create a specialized PySpark coding exercise.
    Category: ${category}
    Difficulty: ${difficulty}
    Context: ${specificContext}

    Ensure the "standardSolution" uses valid PySpark syntax (using pyspark.sql.functions).
    The "sampleData" should be a text representation of a small dataframe or JSON.
  `;

  try {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            inputSchema: { type: Type.STRING, description: "Description of columns and types" },
            sampleData: { type: Type.STRING, description: "Small CSV or JSON representation of input" },
            expectedOutputDescription: { type: Type.STRING, description: "What the resulting dataframe should look like" },
            standardSolution: { type: Type.STRING, description: "Correct PySpark code snippet" }
          },
          required: ["title", "description", "inputSchema", "sampleData", "expectedOutputDescription", "standardSolution"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedExerciseResponse;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Failed to generate exercise:", error);
    throw error;
  }
};

export const evaluateSubmission = async (
  exercise: GeneratedExerciseResponse,
  userCode: string,
  apiKey: string
): Promise<EvaluationResponse> => {
  const prompt = `
    Evaluate the user's PySpark code against the problem statement and the standard solution.

    Problem: ${exercise.description}
    Input Schema: ${exercise.inputSchema}
    Standard Solution:
    ${exercise.standardSolution}

    User Code:
    ${userCode}

    Determine if the user's logic is correct to solve the problem.
    Syntax errors should be marked as incorrect.
    Different valid approaches (e.g. SQL expression vs DataFrame API) are acceptable if they achieve the result.
  `;

  const sysInstruction = "You are a friendly but strict code reviewer. Respond ONLY in JSON.";

  try {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING, description: "Constructive feedback explaining the error or praising the solution." },
            improvedCode: { type: Type.STRING, description: "Optional. If the user's code was messy or wrong, provide a clean version." }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EvaluationResponse;
    }
    throw new Error("Empty evaluation response");
  } catch (error) {
    console.error("Failed to evaluate submission:", error);
    return {
      isCorrect: false,
      feedback: "System error during evaluation. Please check your API Key in Settings."
    };
  }
};