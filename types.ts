
export enum AppStep {
  INPUT_IDEA = 0,
  REFINE_PROMPT = 1,
  VIEW_RESULT = 2,
  BILLING = 3
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

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageResolution = "1K" | "2K" | "4K";
