import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// Note: API_KEY is expected to be in the environment variables
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini to break down a complex task into actionable subtasks.
 */
export const generateSubtasks = async (taskText: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided. Mocking response for demo purposes.");
    // Fallback if no key is present to prevent app crash in preview without key
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      `Research ${taskText}`,
      `Draft outline for ${taskText}`,
      `Review and finalize ${taskText}`
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the following task into 3 to 5 concrete, actionable subtasks. Keep them concise. Task: "${taskText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const subtasks = JSON.parse(jsonText);
    return Array.isArray(subtasks) ? subtasks : [];
  } catch (error) {
    console.error("Failed to generate subtasks:", error);
    throw error;
  }
};