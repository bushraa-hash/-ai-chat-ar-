import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const initGemini = (apiKey) => {
  const finalKey = apiKey?.trim() || import.meta.env.VITE_GOOGLE_API_KEY?.trim();
  
  if (finalKey && finalKey !== 'YOUR_GOOGLE_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(finalKey);
  }
};

export const getGeminiModel = (modelName = "gemini-1.5-flash", systemInstruction = "") => {
    if(!genAI) {
        initGemini();
    }
    if(!genAI) {
        throw new Error("عذراً، يجب إعداد مفتاح Google API في الإعدادات أولاً.");
    }
    
    return genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
    });
}
