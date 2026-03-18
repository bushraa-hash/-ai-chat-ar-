import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Bot } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('كلمات المرور غير متطابقة');
    }

    try {
      setError('');
      setMessage('');
      setLoading(true);
      await register(email, password, name);
      setMessage('نجاح! تحقق من بريدك الإلكتروني لتفعيل الحساب.');
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('فشل إنشاء الحساب. تأكد من صحة البيانات أو حاول ببريد آخر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl transition-all">
        
        <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg">
                <Bot size={32} />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">إنشاء حساب</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                أو{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                قم بتسجيل الدخول إلى حسابك 
                </Link>
            </p>
        </div>

        {error && <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
        {message && <div className="p-4 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">{message}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="الاسم الكامل"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="مثال: أحمد علي"
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
             <Input
              label="تأكيد كلمة المرور"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" loading={loading}>
              إنشاء حساب جديد
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
