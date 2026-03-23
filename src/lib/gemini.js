import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

const getStoredApiKey = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('google_api_key')?.trim() || '';
};

export const initGemini = (apiKey) => {
  const finalKey =
    apiKey?.trim() ||
    getStoredApiKey() ||
    import.meta.env.VITE_GOOGLE_API_KEY?.trim();

  if (finalKey && finalKey !== 'YOUR_GOOGLE_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(finalKey);
  } else {
    genAI = null;
  }
};

export const getGeminiModel = (modelName = "gemini-2.5-flash", systemInstruction = "") => {
  if (!genAI) {
    initGemini();
  }

  if (!genAI) {
    throw new Error("عذرًا، يجب إعداد مفتاح Google API في الإعدادات أولًا.");
  }

  const config = { model: modelName };
  if (systemInstruction && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction;
  }

  return genAI.getGenerativeModel(config);
};
