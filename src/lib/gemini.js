import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const initGemini = (apiKey) => {
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (envKey && envKey !== 'YOUR_GOOGLE_API_KEY_HERE') {
       genAI = new GoogleGenerativeAI(envKey);
    }
  }
};

export const getGeminiModel = () => {
    if(!genAI) {
        initGemini();
    }
    if(!genAI) {
        throw new Error("عذراً، يجب إعداد مفتاح Google API في الإعدادات أولاً.");
    }
    
    return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}
