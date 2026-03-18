import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getGeminiModel } from '../lib/gemini';
import { Button } from '../components/ui/Button';
import { ChatMessage } from '../components/chat/ChatMessage';
import { Sidebar } from '../components/layout/Sidebar';
import { Send, Loader2, Bot, Menu, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiError, setApiError] = useState('');
  const [memories, setMemories] = useState([]);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if(!user) {
        navigate('/login');
        return;
    }
    fetchMemories();
  }, [user]);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('fact')
        .eq('user_id', user.id);
      
      if (!error && data) {
         setMemories(data.map(m => m.fact));
      }
    } catch (err) {
      console.warn("Could not fetch memories:", err);
    }
  };

  useEffect(() => {
    if(!user) {
        navigate('/login');
        return;
    }
    fetchMemories();
    checkForLegacyChats();
  }, [user]);

  const checkForLegacyChats = async () => {
    // Check if there are chats with no session_id
    const { data, error } = await supabase
      .from('chats')
      .select('id')
      .is('session_id', null)
      .eq('user_id', user.id)
      .limit(1);
    
    if (!error && data && data.length > 0) {
       console.log("Legacy chats found. Requesting user to migrate.");
       // We can trigger a migration later or just show a button.
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
           console.log("Supabase error (expected if table not created yet):", error);
           // If table doesn't exist, we just start with empty messages and don't block the UI
           return;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    let sessionId = currentSessionId;
    const isNewSession = !sessionId;

    const userMessageText = input;
    const userMessage = { role: 'user', content: userMessageText };
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setApiError('');

    try {
      // 1. Create session if it doesn't exist
      if (isNewSession) {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('sessions')
          .insert([{ 
            user_id: user.id, 
            title: userMessageText.substring(0, 30) + (userMessageText.length > 30 ? '...' : '') 
          }])
          .select()
          .single();
        
        if (sessionErr) throw sessionErr;
        sessionId = sessionData.id;
        setCurrentSessionId(sessionId);
      }

      // 2. Prepare System Instruction (Long-Term Memory)
      const systemPrompt = memories.length > 0 
        ? `أنت مساعد ذكي يتذكر معلومات هامة عن المستخدم لتحسين تجربته. هذه حقائق تعرفها عنه بالفعل: \n- ${memories.join('\n- ')}\n\nتواصل معه بناءً على هذا السياق.`
        : "أنت مساعد ذكي مفيد وودود جداً يتحدث باللغة العربية.";

      // 3. Prepare history for Gemini
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // 4. Get AI Response with Multi-Model Fallback
      const modelsToTry = ["models/gemini-1.5-flash", "gemini-1.5-flash", "models/gemini-pro"];
      let aiText = "";
      let success = false;
      let lastErrorMessage = "";

      for (const mName of modelsToTry) {
        try {
          // Some environments require 'models/' prefix, others don't. SDK handles it, 
          // but we try both if needed or stick to standard.
          const model = getGeminiModel(mName, systemPrompt);
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(userMessageText);
          const response = await result.response;
          aiText = response.text();
          if (aiText) {
            success = true;
            break;
          }
        } catch (mErr) {
          lastErrorMessage = mErr.message;
          console.warn(`Model ${mName} failed:`, mErr.message);
        }
      }

      if (!success) {
          throw new Error(`تعذر الاتصال بالذكاء الاصطناعي: ${lastErrorMessage}`);
      }

      const aiMessage = { role: 'ai', content: aiText };
      setMessages(prev => [...prev, aiMessage]);

      // 5. Save messages to Supabase
      try {
           await supabase.from('chats').insert([
               { user_id: user.id, session_id: sessionId, role: 'user', content: userMessageText },
               { user_id: user.id, session_id: sessionId, role: 'ai', content: aiText }
           ]);
      } catch (dbErr) {
           console.warn("Could not save to db:", dbErr);
      }

      // 6. Background Activity: Extract and Save New Memories (Facts about user)
      if (success) extractAndSaveMemory(userMessageText, aiText);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.slice(0, -1)); 
      setApiError(error.message || 'حدث خطأ غير متوقع أثناء التواصل مع الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  const extractAndSaveMemory = async (userText, aiText) => {
    try {
      const prompt = `المستخدم قال: "${userText}"\nالمساعد رد: "${aiText}"`;
      const systemInstruction = "أنت خبير في استخراج الحقائق والاهتمامات عن المستخدمين. استخرج أي حقيقة جديدة هامة ذكرها المستخدم في الرسالة التالية (مثل اسمه، عمله، تفضيلاته، مدينته). إذا لم توجد حقيقة هامة جديدة، أجب بكلمة 'NONE'. إذا وجدت أكثر من حقيقة، افصل بينهم بفاصلة.";
      
      const mNames = ["gemini-1.5-flash", "gemini-pro"];
      let fact = "";

      for (const mName of mNames) {
        try {
          const model = getGeminiModel(mName, systemInstruction);
          const result = await model.generateContent(prompt);
          fact = (await result.response).text().trim();
          if (fact) break;
        } catch (err) {
          console.warn(`Memory extraction model ${mName} failed`);
        }
      }
      
      if (fact && fact !== 'NONE' && !memories.some(m => fact.includes(m))) {
        await supabase.from('user_memories').insert([{ user_id: user.id, fact }]);
        setMemories(prev => [...prev, fact]);
      }
    } catch (err) {
      console.warn("Memory extraction failed:", err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setApiError('');
  };

  const handleSelectChat = (sessionId) => {
    setCurrentSessionId(sessionId);
    fetchMessages(sessionId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 dark:bg-gray-900 transition-colors overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        onNewChat={handleNewChat} 
        currentChatId={currentSessionId}
        onSelectChat={handleSelectChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Mobile Header (Hidden on MD) */}
        <div className="md:hidden flex items-center justify-between p-4 glass border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-2 font-bold text-purple-600">
              <Bot size={24} />
              <span>مساعدي</span>
           </div>
           <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
           </Button>
        </div>

        {apiError && (
            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 m-4 rounded-xl animate-slide-up" role="alert">
              <p className="text-sm font-medium">{apiError}</p>
            </div>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-4 md:px-6 relative">
          
          {/* Welcome Header */}
          {messages.length > 0 && (
             <div className="pt-6 pb-2 border-b border-gray-100 dark:border-gray-800 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                   <Sparkles size={16} className="text-amber-500" />
                   <span>محادثة ذكية</span>
                </div>
                <div className="text-xs text-gray-400">
                   {messages.length} رسائل
                </div>
             </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-slide-up">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-purple-200/50 dark:shadow-none rotate-3">
                   <Bot size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">مرحباً بك في مساعدك الذكي!</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                   أنا هنا لمساعدتك في كل شيء، من كتابة الكود إلى الإجابة على استفساراتك اليومية. 
                   <br/> <span className="text-purple-600 dark:text-purple-400 font-medium italic mt-2 block">لقد أصبحت الآن أتذكر سياق حديثنا!</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-lg">
                   {['كيف يمكنني تحسين كود React؟', 'اكتب لي قصيدة عن التقنية', 'اشرح لي مفهوم الـ API', 'ما هي أفضل الممارسات في الـ CSS؟'].map((suggest, i) => (
                      <button 
                        key={i}
                        onClick={() => { setInput(suggest); }}
                        className="p-3 text-sm text-right bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all text-gray-600 dark:text-gray-400"
                      >
                        {suggest}
                      </button>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-10">
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg.content} isAI={msg.role === 'ai'} />
                ))}
                {loading && (
                   <div className="flex w-full mb-8 justify-start animate-pulse">
                   <div className="flex max-w-[80%] items-start gap-4 flex-row">
                     <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                        <Bot size={20} />
                     </div>
                     <div className="px-5 py-4 rounded-3xl shadow-sm bg-white border border-gray-100 text-gray-400 dark:bg-gray-800 dark:border-gray-700 rounded-tr-none flex items-center gap-3">
                       <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> 
                       <span className="text-sm font-medium">يفكر الآن...</span>
                     </div>
                   </div>
                 </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-none pt-4 pb-6 glass z-10 sticky bottom-0 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <form onSubmit={handleSend} className="relative flex items-center w-full max-w-3xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur-md opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسألني عن أي شيء..."
                className="relative block w-full rounded-3xl border-0 py-4 px-6 pe-16 text-gray-900 shadow-xl ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-base sm:leading-6 dark:bg-gray-900/90 dark:text-white dark:ring-gray-700 dark:placeholder-gray-500 resize-none h-14 overflow-hidden focus:h-auto max-h-40"
                rows={1}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute left-2.5 top-2 p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
              </button>
            </form>
            <div className="text-center mt-3 text-xs text-gray-400 dark:text-gray-500">
               مدعوم بـ <span className="font-semibold text-purple-500">Gemini AI</span> • يتذكر السياق تلقائياً
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
