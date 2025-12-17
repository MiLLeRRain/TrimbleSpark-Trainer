export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum Category {
  POINT_CLOUD = '3D Point Cloud Processing',
  GEOSPATIAL = 'Geospatial & Joins',
  TELEMATICS = 'Equipment Telematics (Time Series)',
  ASSET_MGMT = 'Asset Management (Construction)'
}

export enum ExerciseStatus {
  NEW = 'NEW',
  CORRECT = 'CORRECT',
  REVIEW = 'REVIEW', // User got it wrong and needs to review
}

export interface Exercise {
  id: string;
  category: Category;
  difficulty: Difficulty;
  title: string;
  description: string;
  inputSchema: string;
  sampleData: string;
  expectedOutputDescription: string;
  standardSolution: string; // The "Golden" PySpark code
  userCode?: string;
  feedback?: string; // AI Feedback
  status: ExerciseStatus;
  timestamp: number;
}

export interface GeneratedExerciseResponse {
  title: string;
  description: string;
  inputSchema: string;
  sampleData: string;
  expectedOutputDescription: string;
  standardSolution: string;
}

export interface EvaluationResponse {
  isCorrect: boolean;
  feedback: string;
  improvedCode?: string;
}

export interface AppSettings {
  geminiApiKey: string; // Allow user to input key if env var is missing
}