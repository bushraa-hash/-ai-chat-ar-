import { getGeminiModel } from './gemini';

const getLocalApiKey = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('google_api_key')?.trim() || '';
};

const isLocalDev = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

const parseError = async (response) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (payload?.error) {
    const error = new Error(payload.error);
    error.code = payload.code;
    error.retryAfterSeconds = payload.retryAfterSeconds;
    throw error;
  }

  throw new Error('تعذر إكمال الطلب. حاول مرة أخرى.');
};

export const callChatApi = async (body) => {
  const localApiKey = getLocalApiKey();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localApiKey ? { 'x-google-api-key': localApiKey } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  } catch (error) {
    if (!isLocalDev()) {
      throw error;
    }

    const { mode = 'chat', history = [], message = '', prompt = '', systemPrompt = '' } = body || {};
    const modelName = mode === 'memory' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
    const model = getGeminiModel(modelName, systemPrompt);

    if (mode === 'memory') {
      const result = await model.generateContent(prompt);
      return { text: (await result.response).text().trim() };
    }

    const result = await model.generateContent({
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] },
      ],
    });

    return { text: (await result.response).text() };
  }
};
