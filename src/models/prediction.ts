export type PredictionResult = {
  success: boolean;
  personName: string;
  confidence: number; // 0 a 100
  isRegistered: boolean;
  message: string;
  predictedClassName?: string;
  predictedConfidence?: number;
};
