
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AspectRatio, ImageResolution } from "../types";

// Helper to check for quota/rate limit errors
const isQuotaError = (error: any): boolean => {
  const msg = typeof error?.message === 'string' ? error.message : '';
  const status = error?.status;
  // Check for 429 status or specific keywords in the message
  return msg.includes("429") || 
         msg.toLowerCase().includes("quota") || 
         msg.includes("RESOURCE_EXHAUSTED") ||
         status === 429 || 
         status === "RESOURCE_EXHAUSTED";
};

/**
 * Uses a lightweight multimodal model with thinking budget to convert a raw user idea 
 * into a professional image prompt.
 */
export const generateEnhancedPrompt = async (
  userDescription: string, 
  referenceImages: string[] = [], 
  style: string | null, 
  camera: string | null,
  isAiMode: boolean
): Promise<string> => {
  // Always create a new instance to pick up the most current API key
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const modelId = "gemini-3-flash-preview";
  
  const styleInstruction = isAiMode 
    ? "MODE: Commercial Studio Photography. The goal is to create an image that looks like a real, high-budget commercial photoshoot. Use professional studio lighting (softbox, rim light, butterfly lighting), 8k resolution, ultra-realistic textures, and precise color grading. No cartoon, anime, or painterly effects unless explicitly requested." 
    : `Target Style: ${style || "General"}`;

  const cameraInstruction = isAiMode
    ? "Camera: Medium Format Digital (e.g., Phase One XF). Lens: 85mm Portrait or 50mm Standard. Aperture: f/8 for sharpness. Lighting: Three-point studio setup."
    : `Camera Angle: ${camera || "Neutral"}`;

  const systemInstruction = `
    You are an expert AI art director and Commercial Photographer.
    Your task: Convert a raw description and optional reference images into a highly detailed image generation prompt.
    
    ${styleInstruction}
    ${cameraInstruction}
    
    Guidelines:
    1. Analyze reference images (if any) for style, palette, and composition.
    2. Enhance the text description with visual keywords specific to the chosen style and camera angle.
    3. If the user provided a very short description, expand on it creatively.
    4. Provide technical details: lighting, depth of field, texture, and medium.
    5. Output ONLY the raw prompt text. Do not add intro/outro text.
  `;

  try {
    const parts: any[] = [];
    const basePrompt = userDescription || (isAiMode ? "Create a masterpiece commercial product shot." : `Create a ${style} image.`);
    
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
        temperature: 1.0,
        // Use thinking budget for better art direction reasoning
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated from the model.");
    return text.trim();
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

// Normalize aspect ratios to standard values supported by the API to prevent 400 errors
const normalizeAspectRatio = (ratio: AspectRatio): string => {
  switch (ratio) {
    case "2:3": return "3:4";
    case "3:2": return "4:3";
    case "21:9": return "16:9";
    case "1:1": 
    case "3:4":
    case "4:3":
    case "9:16":
    case "16:9":
      return ratio;
    default: return "1:1";
  }
};

/**
 * Uses the image model to generate an image.
 */
export const generateImage = async (
  prompt: string, 
  config: ImageConfig, 
  referenceImages: string[] = [], 
  style: string = "Cinematic",
  camera: string | null = null,
  maskImage: string | null = null,
  modelTier: 'flash' | 'pro' = 'pro'
): Promise<string> => {
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  // Select model based on tier
  const targetModelId = modelTier === 'pro' ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
  const fallbackModelId = "gemini-2.5-flash-image";

  const runGeneration = async (modelId: string) => {
      const isProModel = modelId === "gemini-3-pro-image-preview";
      
      const parts: any[] = [];
      
      // 1. Add Reference Images
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

      // 2. Add Mask if present
      if (maskImage) {
          const matches = maskImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
              parts.push({
                  inlineData: {
                      mimeType: matches[1],
                      data: matches[2]
                  }
              });
          }
      }

      // 3. Construct Prompt
      let styledPrompt = `Style: ${style}. ${camera ? `Camera/Lens: ${camera}.` : ''} ${prompt}`;
      if (maskImage) {
          styledPrompt = `EDIT INSTRUCTION: Modify the image area covered by the white mask. ${prompt}. Keep the rest of the image exactly as is. Match the style, lighting, and perspective of the original image.`;
      }

      parts.push({ text: styledPrompt });

      const genConfig: any = {
          aspectRatio: normalizeAspectRatio(config.aspectRatio),
      };

      // imageSize is only supported by gemini-3-pro-image-preview
      if (isProModel) {
          genConfig.imageSize = config.resolution;
      }

      // Google Search is only available for gemini-3-pro-image-preview
      const tools = config.useGoogleSearch && isProModel ? [{ googleSearch: {} }] : undefined;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: {
          imageConfig: genConfig,
          tools: tools as any
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
          throw new Error("Generation blocked by safety filters or failed. Try a different prompt.");
      }

      const partsList = response.candidates[0].content.parts;
      for (const part of partsList) {
          if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              return `data:${mimeType};base64,${base64Data}`;
          }
      }
      throw new Error("No image data returned from the API.");
  };

  try {
    // Attempt generation with target model
    return await runGeneration(targetModelId);
  } catch (error: any) {
    console.warn(`Attempt with ${targetModelId} failed:`, error);
    
    // Fallback logic only if we started with Pro and failed, and want to try Flash
    // If we started with Flash (Free tier), no fallback usually (unless we want to retry same model)
    if (modelTier === 'pro') {
        try {
            console.log(`Falling back to ${fallbackModelId}...`);
            return await runGeneration(fallbackModelId);
        } catch (fallbackError: any) {
            console.error("Fallback generation failed:", fallbackError);
            if (isQuotaError(fallbackError) || isQuotaError(error)) {
                throw new Error("⚠️ System Busy: API usage limit reached. Please wait a moment and try again.");
            }
            throw fallbackError;
        }
    }
    
    if (isQuotaError(error)) {
        throw new Error("⚠️ System Busy: API usage limit reached. Please wait a moment and try again.");
    }
    throw error;
  }
};

/**
 * Analyzes an image using the vision model.
 */
export const analyzeImage = async (
    imageBase64: string, 
    prompt: string
): Promise<string> => {
    const apiKey = process.env.API_KEY || "";
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-pro-preview";

    const parts: any[] = [];
    
    // Add image
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

    // Add prompt
    parts.push({ text: prompt || "Describe this image in detail." });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: {
                // Optional: add system instruction for analysis role
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
