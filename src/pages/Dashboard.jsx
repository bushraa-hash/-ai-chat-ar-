import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getGeminiModel } from '../lib/gemini';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChatMessage } from '../components/chat/ChatMessage';
import { Send, Loader2, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
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
    fetchMessages();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
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

    const userMessageText = input;
    const userMessage = { role: 'user', content: userMessageText };
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setApiError('');

    try {
      // 1. Get AI Response
      const model = getGeminiModel();
      const result = await model.generateContent(userMessageText);
      const response = await result.response;
      const aiText = response.text();
      const aiMessage = { role: 'ai', content: aiText };

      setMessages(prev => [...prev, aiMessage]);

      // 2. Save to Supabase (Best effort)
      try {
           await supabase.from('chats').insert([
               { user_id: user.id, role: 'user', content: userMessageText },
               { user_id: user.id, role: 'ai', content: aiText }
           ]);
      } catch (dbErr) {
           console.warn("Could not save to db (perhaps table not created):", dbErr);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.slice(0, -1)); // optionally remove user message or show error mark
      setApiError(error.message || 'حدث خطأ غير متوقع أثناء التواصل مع الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-gray-900 transition-colors">
      
      {apiError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4" role="alert">
            <p>{apiError}</p>
          </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full p-4 md:p-6 lg:p-8">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto mb-6 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 text-purple-600 rounded-full flex items-center justify-center mb-4">
                 <Bot size={32} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">مرحباً بك!</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">أنا مساعدك الذكي مستعد للإجابة على جميع أسئلتك. كيف يمكنني مساعدتك اليوم؟</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg.content} isAI={msg.role === 'ai'} />
              ))}
              {loading && (
                 <div className="flex w-full mb-6 justify-start">
                 <div className="flex max-w-[80%] items-start gap-4 flex-row">
                   <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                      <Bot size={20} />
                   </div>
                   <div className="px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed bg-white border border-gray-100 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-tr-none flex items-center gap-2">
                     <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> يكتب...
                   </div>
                 </div>
               </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-none pb-4 md:pb-6">
          <form onSubmit={handleSend} className="relative flex items-center w-full max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسألني عن أي شيء..."
              className="block w-full rounded-full border-0 py-4 px-6 pe-16 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-base sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:placeholder-gray-500 resize-none h-14 overflow-hidden"
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
              className="absolute left-2 top-2 p-2.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-gray-400">
             يمكن للذكاء الاصطناعي أن يخطئ، لذا يرجى التحقق من المعلومات المهمة.
          </div>
        </div>

      </main>
    </div>
  );
}
