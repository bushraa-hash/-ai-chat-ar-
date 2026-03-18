import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  LogOut, 
  User, 
  Bot,
  Loader2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar({ onNewChat, currentChatId, onSelectChat, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Sessions table might not exist yet:", error);
      } else if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, currentChatId]);

  const handleSelect = (sessionId) => {
    onSelectChat(sessionId);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleNew = () => {
    onNewChat();
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`fixed inset-y-0 right-0 z-50 flex flex-col w-72 h-full glass border-l border-gray-200 dark:border-gray-800 transition-all duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } md:relative md:translate-x-0 md:flex`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleNew}
            className="w-full btn-premium group"
          >
            <div className="btn-premium-inner">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>محادثة جديدة</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            المحادثات السابقة
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-purple-500" size={20} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
               <MessageSquare className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={24} />
               <p className="text-xs text-gray-400">لا توجد محادثات محفوظة</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelect(session.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  currentChatId === session.id 
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <MessageSquare size={16} className={`flex-shrink-0 ${currentChatId === session.id ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className="truncate text-right w-full">{session.title || 'محادثة بلا عنوان'}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
          <div className="flex flex-col gap-1">
            <Link 
              to="/settings"
              onClick={() => window.innerWidth < 768 && onClose && onClose()}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                location.pathname === '/settings' 
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <Settings size={18} />
              <span>الإعدادات</span>
            </Link>
            <button 
              onClick={() => {
                logout();
                if (window.innerWidth < 768 && onClose) onClose();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.user_metadata?.name || 'مستخدم'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>

  );
}
