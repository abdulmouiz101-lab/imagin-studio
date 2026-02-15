import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio, ImageResolution } from "../types";

// Helper to check for quota/rate limit errors
const isQuotaError = (error: any): boolean => {
  if (error?.error) {
     const inner = error.error;
     if (inner.code === 429 || inner.status === "RESOURCE_EXHAUSTED") return true;
     if (inner.message && typeof inner.message === 'string' && 
         (inner.message.includes("429") || inner.message.toLowerCase().includes("quota") || inner.message.includes("RESOURCE_EXHAUSTED"))) {
         return true;
     }
  }

  const msg = typeof error?.message === 'string' ? error.message : '';
  const status = error?.status;
  return msg.includes("429") || 
         msg.toLowerCase().includes("quota") || 
         msg.includes("RESOURCE_EXHAUSTED") ||
         status === 429 || 
         status === "RESOURCE_EXHAUSTED";
};

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Uses Gemini to act as an AI Prompt Engineer.
 * Analyzes requirements and references to generate a detailed prompt.
 */
export const generateEnhancedPrompt = async (
  userDescription: string, 
  referenceImages: string[] = [], 
  style: string | null, 
  camera: string | null,
  isAiMode: boolean
): Promise<string> => {
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const modelId = "gemini-3-flash-preview";
  
  const styleInstruction = isAiMode 
    ? "MODE: Commercial Studio Photography. High-budget, ultra-realistic, 8k resolution." 
    : `Target Style: ${style || "Photorealistic"}`;

  const cameraInstruction = camera ? `Camera settings: ${camera}` : "";

  const systemInstruction = `
    You are an AI Image Prompt Engineer. 
    When a user asks for a mockup or image, analyze their reference and requirements. 
    Generate a highly detailed English prompt suitable for the Flux image generation model.
    
    ${styleInstruction}
    ${cameraInstruction}
    
    Guidelines:
    1. Include details on lighting, texture, composition, and mood.
    2. If reference images are provided, incorporate their key visual elements into the text description.
    3. Output ONLY the raw prompt text. Do not add intro/outro text.
  `;

  try {
    const parts: any[] = [];
    const basePrompt = userDescription || (isAiMode ? "Create a masterpiece commercial product shot." : `Create a ${style || "Photorealistic"} image.`);
    
    parts.push({ text: basePrompt });

    referenceImages.forEach((base64String) => {
      const matches = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated from the model.");
    
    return text.trim().replace(/^["']+|["']+$/g, '').replace(/^Prompt:\s*/i, '');
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    if (isQuotaError(error)) {
        throw new Error("⚠️ Text generation limit reached. Please wait a moment and try again.");
    }
    throw error;
  }
};

interface ImageConfig {
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  useGoogleSearch?: boolean;
}

/**
 * Generates an image using Google Gemini Image Models.
 * Uses 'gemini-2.5-flash-image' for standard/free tiers.
 * Uses 'gemini-3-pro-image-preview' for pro tier.
 */
export const generateImage = async (
  prompt: string, 
  config: ImageConfig, 
  referenceImages: string[] = [], 
  style: string = "Cinematic",
  camera: string | null = null,
  maskImage: string | null = null, 
  modelTier: 'flash' | 'pro' = 'flash'
): Promise<string> => {
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  // Select Model based on tier
  // Default to 2.5 Flash Image. Upgrade to 3 Pro Image if 'pro' tier.
  const model = modelTier === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Map App Aspect Ratio to Gemini Supported Ratios
  // Gemini Supports: "1:1", "3:4", "4:3", "9:16", "16:9"
  const ratioMap: Record<string, string> = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4',
    '21:9': '16:9', // Closest match
    '3:2': '4:3',   // Closest match
    '2:3': '3:4'    // Closest match
  };
  const targetRatio = ratioMap[config.aspectRatio] || '1:1';

  // 1. Prepare Content Parts
  const parts: any[] = [];

  // Add reference images (used for Editing or Image-to-Image)
  // If maskImage exists, treat it as a reference/source for the edit operation
  const imagesToInclude = [...referenceImages];
  if (maskImage && !imagesToInclude.includes(maskImage)) {
      imagesToInclude.push(maskImage);
  }

  for (const imgStr of imagesToInclude) {
    const matches = imgStr.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }

  // Add Prompt
  let cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
  const fullPromptParts = [cleanPrompt];
  if (style) fullPromptParts.push(`${style} style`);
  if (camera) fullPromptParts.push(camera);
  
  parts.push({ text: fullPromptParts.join(', ') });

  // 2. Prepare Config
  const imageConfig: any = {
    aspectRatio: targetRatio,
  };

  // Image Size is only supported on Pro model
  if (model === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = config.resolution || "1K";
  }

  const reqConfig: any = {
    imageConfig: imageConfig
  };

  // Google Search Tool (Only for Pro model)
  if (config.useGoogleSearch && model === 'gemini-3-pro-image-preview') {
      reqConfig.tools = [{googleSearch: {}}];
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: reqConfig
    });

    // 3. Extract Image from Response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Check for text feedback if no image (e.g., refusal)
    const textOutput = response.text;
    if (textOutput) {
        console.warn("Model returned text instead of image:", textOutput);
        throw new Error(`Generation blocked or failed: ${textOutput.slice(0, 100)}...`);
    }

    throw new Error("No image generated from Gemini.");

  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    if (isQuotaError(error)) {
        throw new Error("⚠️ Image generation limit reached. Please wait a moment.");
    }
    if (error.message.includes("SAFETY")) {
        throw new Error("⚠️ The prompt violated safety guidelines. Please modify your request.");
    }
    throw new Error(error.message || "Image generation failed.");
  }
};

export const analyzeImage = async (
    imageBase64: string, 
    prompt: string
): Promise<string> => {
    const apiKey = process.env.API_KEY || "";
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-flash-preview";

    const parts: any[] = [];
    
    const matches = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        parts.push({
            inlineData: {
                mimeType: matches[1],
                data: matches[2]
            }
        });
    } else {
        throw new Error("Invalid image format");
    }

    parts.push({ text: prompt || "Describe this image in detail." });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: {
                systemInstruction: "You are a professional image analyst. Provide detailed, accurate, and helpful insights about the images provided."
            }
        });

        const text = response.text;
        if (!text) throw new Error("No analysis generated.");
        return text;
    } catch (error: any) {
        console.error("Error analyzing image:", error);
        if (isQuotaError(error)) {
            throw new Error("⚠️ Analysis limit reached. Please wait a moment and try again.");
        }
        throw error;
    }
};

export const transcribeAudio = async (
    audioBase64: string
): Promise<string> => {
    const apiKey = process.env.API_KEY || "";
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-flash-preview";

    const parts: any[] = [];

    const matches = audioBase64.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        parts.push({
            inlineData: {
                mimeType: matches[1],
                data: matches[2]
            }
        });
    } else {
        throw new Error("Invalid audio data format");
    }

    parts.push({ text: "Transcribe this audio exactly as spoken. Ignore background noise." });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: {
              systemInstruction: "You are a professional transcriber."
            }
        });

        const text = response.text;
        if (!text) throw new Error("No transcription generated.");
        return text;
    } catch (error: any) {
        console.error("Error transcribing audio:", error);
        if (isQuotaError(error)) {
            throw new Error("⚠️ Transcription limit reached. Please wait a moment and try again.");
        }
        throw error;
    }
};

export const vectorizeImage = async (
    imageBase64: string
): Promise<string> => {
    // Uses ImageTracer.js (loaded in index.html) to perform client-side vectorization
    // This serves as a "Free API" alternative as requested.
    if (typeof window === 'undefined' || !(window as any).ImageTracer) {
         throw new Error("Vectorization library missing. Please refresh the page.");
    }

    return new Promise((resolve, reject) => {
        try {
            // Configuration for decent quality photo-to-vector
            // Simulates high-quality vectorization APIs
            const options = {
                ltres: 1, // Linear error threshold (lower = more detail)
                qtres: 1, // Quadratic error threshold (lower = more detail)
                pathomit: 8, // Path omission threshold (higher = less noise)
                rightangleenhance: false, // Enhance right angles
                colorsampling: 2, // 0=disabled, 1=random, 2=deterministic
                numberofcolors: 16, // Max colors to use
                mincolorratio: 0.02,
                colorquantcycles: 3,
                scale: 1,
                simplifytolerance: 0,
                roundcoords: 1, 
                lcpr: 0,
                qcpr: 0,
                desc: false,
                viewbox: true, // IMPORTANT: Adds viewBox for scaling
                blurradius: 0,
                blurdelta: 20
            };
            
            (window as any).ImageTracer.imageToSVG(
                imageBase64,
                (svgstr: string) => {
                    if (!svgstr) reject(new Error("Failed to generate SVG string."));
                    resolve(svgstr);
                },
                options
            );
        } catch (e) {
            console.error("Vectorization error:", e);
            reject(new Error("Failed to convert image to vector."));
        }
    });
};