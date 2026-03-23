import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const hasRecoveryToken = () => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  return hash.includes('type=recovery') || hash.includes('access_token=');
};

export default function ResetPassword() {
  const { resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const recoveryMode = useMemo(() => hasRecoveryToken(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await resetPassword(email);
      setMessage('أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err) {
      setError(err.message || 'تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      await updatePassword(password);
      setMessage('تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'تعذر تحديث كلمة المرور. افتح الرابط من جديد وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl transition-all">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg">
            {recoveryMode ? <KeyRound size={30} /> : <Bot size={30} />}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {recoveryMode ? 'تعيين كلمة مرور جديدة' : 'استعادة كلمة المرور'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {recoveryMode
              ? 'أدخل كلمة المرور الجديدة لإكمال استعادة الحساب.'
              : 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.'}
          </p>
        </div>

        {error && <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
        {message && <div className="p-4 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">{message}</div>}

        {recoveryMode ? (
          <form className="space-y-6" onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <Input
                label="كلمة المرور الجديدة"
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
            <Button type="submit" className="w-full" loading={loading}>
              حفظ كلمة المرور
            </Button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleRequestReset}>
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            <Button type="submit" className="w-full" loading={loading}>
              إرسال الرابط
            </Button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
