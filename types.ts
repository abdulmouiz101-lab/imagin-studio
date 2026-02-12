
export enum AppStep {
  INPUT_IDEA = 0,
  REFINE_PROMPT = 1,
  VIEW_RESULT = 2,
  BG_REMOVER = 3,
  IMAGE_ANALYSIS = 4,
  BILLING = 5
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageResolution = "1K" | "2K" | "4K";
