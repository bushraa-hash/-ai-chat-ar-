import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MEMORY_MODEL = 'gemini-2.5-flash-lite';

const getApiKey = (req) => {
  const headerKey = req.headers['x-google-api-key'];
  return headerKey || process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || '';
};

const extractRetryDelay = (message = '') => {
  const secondsMatch = message.match(/retry in ([\d.]+)s/i);
  if (secondsMatch) {
    return Math.ceil(Number(secondsMatch[1]));
  }

  const delayMatch = message.match(/"retryDelay":"(\d+)s"/i);
  if (delayMatch) {
    return Number(delayMatch[1]);
  }

  return null;
};

const formatGeminiError = (error) => {
  const message = error?.message || 'حدث خطأ غير متوقع أثناء الاتصال بـ Gemini.';
  const isQuotaError =
    message.includes('[429') ||
    message.toLowerCase().includes('quota exceeded') ||
    message.toLowerCase().includes('rate limit');

  if (!isQuotaError) {
    return {
      status: 500,
      payload: {
        code: 'GEMINI_ERROR',
        error: `تعذر الاتصال بالذكاء الاصطناعي. ${message}`,
      },
    };
  }

  const retryAfterSeconds = extractRetryDelay(message);
  const retryText = retryAfterSeconds
    ? ` يمكنك إعادة المحاولة بعد حوالي ${retryAfterSeconds} ثانية.`
    : ' جرّب مرة أخرى بعد قليل.';

  return {
    status: 429,
    payload: {
      code: 'QUOTA_EXCEEDED',
      retryAfterSeconds,
      error: `تم تجاوز حصة Gemini الحالية أو حد الطلبات.${retryText} إذا استمرت المشكلة فراجع الفوترة والحدود في Google AI Studio أو استخدم مفتاح API آخر.`,
    },
  };
};

const buildModel = (apiKey, modelName, systemInstruction) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const config = { model: modelName };

  if (systemInstruction?.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  return genAI.getGenerativeModel(config);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getApiKey(req);
  if (!apiKey) {
    return res.status(500).json({
      code: 'MISSING_API_KEY',
      error: 'مفتاح Gemini غير موجود. أضف GOOGLE_API_KEY في إعدادات Vercel أو أدخل مفتاحًا محليًا من صفحة الإعدادات.',
    });
  }

  const {
    mode = 'chat',
    history = [],
    message = '',
    prompt = '',
    systemPrompt = '',
  } = req.body || {};

  try {
    if (mode === 'memory') {
      const model = buildModel(apiKey, DEFAULT_MEMORY_MODEL, systemPrompt);
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().trim();
      return res.status(200).json({ text });
    }

    const model = buildModel(apiKey, DEFAULT_CHAT_MODEL, systemPrompt);
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await model.generateContent({ contents });
    const text = (await result.response).text();

    return res.status(200).json({ text });
  } catch (error) {
    const { status, payload } = formatGeminiError(error);
    return res.status(status).json(payload);
  }
}
