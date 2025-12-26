
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

export enum PointCloudTopic {
  VOXEL = 'Voxel Downsampling',
  BOUNDING_BOX = 'Bounding Box & Geometric Stats',
  OUTLIER = 'Outlier Removal (SOR/ROR)',
  TILING = 'Spatial Tiling & Octree Indexing',
  CLASSIFICATION = 'Terrain & Ground Classification',
  VOLUMETRICS = 'Volumetrics (Cut-and-Fill)',
  FEATURE = 'Feature Extraction (Primitive Fitting)',
  CHANGE_DETECTION = 'Multi-scan Change Detection',
  MIXED = 'Mixed Point Cloud Topics'
}

export enum ExerciseStatus {
  NEW = 'NEW',
  CORRECT = 'CORRECT',
  REVIEW = 'REVIEW', 
}

export interface Exercise {
  id: string;
  category: Category;
  topic?: string; 
  difficulty: Difficulty;
  title: string;
  description: string;
  inputSchema: string;
  sampleData: string;
  expectedOutputDescription: string;
  expectedOutputExample: string; // Made mandatory to fix type mismatch with GeneratedExerciseResponse
  standardSolution: string;
  userCode?: string;
  feedback?: string;
  status: ExerciseStatus;
  timestamp: number;
}

export interface GeneratedExerciseResponse {
  title: string;
  description: string;
  inputSchema: string;
  sampleData: string;
  expectedOutputDescription: string;
  expectedOutputExample: string; // Mandatory for new generations
  standardSolution: string;
}

export interface EvaluationResponse {
  isCorrect: boolean;
  feedback: string;
  improvedCode?: string;
}

export interface ExamSession {
  id: string;
  category: Category;
  questions: Exercise[];
  currentIndex: number;
  results: { [id: string]: EvaluationResponse };
  startTime: number;
  isFinished: boolean;
}
