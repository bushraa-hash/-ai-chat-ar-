import React from 'react';
import { User, Bot } from 'lucide-react';

export const ChatMessage = ({ message, isAI }) => {
  return (
    <div className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] items-start gap-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${isAI ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
           {isAI ? <Bot size={20} /> : <User size={20} />}
        </div>

        {/* Message Bubble */}
        <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${isAI ? 'bg-white border border-gray-100 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-tr-none' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-tl-none'}`}>
          <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{__html: formatText(message)}} />
        </div>
        
      </div>
    </div>
  );
};

// Simple helper to format bold text (Markdown like) for AI responses
const formatText = (text) => {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
}
