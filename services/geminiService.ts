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

/**
 * Uses the Gemini 3 Flash model to convert a raw user idea 
 * into a professional image prompt.
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
    ? "MODE: Commercial Studio Photography. The goal is to create an image that looks like a real, high-budget commercial photoshoot. Use professional studio lighting (softbox, rim light, butterfly lighting), 8k resolution, ultra-realistic textures, and precise color grading." 
    : `Target Style: ${style || "Photorealistic"}`;

  const cameraInstruction = isAiMode
    ? "Camera: Medium Format Digital (e.g., Phase One XF). Lens: 85mm Portrait or 50mm Standard."
    : `Camera Angle: ${camera || "Neutral"}`;

  const systemInstruction = `
    You are an expert AI art director.
    Your task: Convert a raw user description into a detailed image generation prompt.
    
    ${styleInstruction}
    ${cameraInstruction}
    
    Guidelines:
    1. Enhance the text description with visual keywords specific to the style.
    2. If the user provided a very short description, expand on it creatively.
    3. Provide technical details: lighting, depth of field, texture, and medium.
    4. Output ONLY the raw prompt text. Do not add intro/outro text.
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
        temperature: 0.7, // Lower temperature for more consistent results
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
  modelTier: 'flash' | 'pro' = 'flash'
): Promise<string> => {
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  // Map 'flash' to the Nano Banana equivalent (gemini-2.5-flash-image)
  const targetModelId = modelTier === 'pro' ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
  const fallbackModelId = "gemini-2.5-flash-image";

  const runGeneration = async (modelId: string) => {
      const isProModel = modelId === "gemini-3-pro-image-preview";
      
      const parts: any[] = [];
      
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

      let styledPrompt = `Style: ${style}. ${camera ? `Camera/Lens: ${camera}.` : ''} ${prompt}`;
      if (maskImage) {
          styledPrompt = `EDIT INSTRUCTION: Modify the image area covered by the white mask. ${prompt}. Keep the rest of the image exactly as is. Match the style, lighting, and perspective of the original image.`;
      }

      parts.push({ text: styledPrompt });

      const genConfig: any = {
          aspectRatio: normalizeAspectRatio(config.aspectRatio),
      };

      if (isProModel) {
          genConfig.imageSize = config.resolution;
      }

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
    return await runGeneration(targetModelId);
  } catch (error: any) {
    console.warn(`Attempt with ${targetModelId} failed:`, error);
    
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
}