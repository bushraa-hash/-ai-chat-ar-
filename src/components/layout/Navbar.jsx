import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Settings, Bot } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                <Bot size={24} />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                مساعد الذكاء الاصطناعي
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200">
                  <Home className="w-6 h-6" />
                </Link>
                <Link to="/settings" className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200">
                  <Settings className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-gray-700 hover:text-primary dark:text-gray-300 transition-colors font-medium">تسجيل الدخول</Link>
                <Link to="/register" className="text-primary hover:text-purple-700 font-medium transition-colors">إنشاء حساب</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
