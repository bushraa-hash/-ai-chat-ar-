import React, { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatMessage = ({ message, isAI }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-8 animate-slide-up ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] items-start gap-3 md:gap-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
          isAI 
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
        }`}>
           {isAI ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message Bubble Container */}
        <div className="relative group flex flex-col gap-2">
          {/* Message Bubble */}
          <div className={`px-5 py-4 rounded-3xl shadow-sm text-sm md:text-base leading-relaxed ${
            isAI 
              ? 'bg-white border border-gray-100 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-tr-none prose dark:prose-invert max-w-none' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tl-none shadow-indigo-200 dark:shadow-none font-medium'
          }`}>
            {isAI ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ ...props }) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-3 scrollbar-thin" {...props} />,
                  code: ({ inline, ...props }) => 
                    inline 
                      ? <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props} /> 
                      : <code className="font-mono text-sm" {...props} />
                }}
              >
                {message}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message}</p>
            )}
          </div>

          {/* Action Buttons (Copy) - visible on hover for AI */}
          {isAI && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5 text-xs"
                title="نسخ النص"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
