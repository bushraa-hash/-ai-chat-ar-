import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Settings as SettingsIcon, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('google_api_key') || '');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('google_api_key', apiKey);
      setMessage('تم حفظ المفتاح المحلي بنجاح. سيُستخدم هذا المفتاح عند إرسال الرسائل من هذا المتصفح.');
    } else {
      localStorage.removeItem('google_api_key');
      setMessage('تم حذف المفتاح المحلي. سيعود التطبيق لاستخدام مفتاح الخادم إن وُجد.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 pt-8 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h2>
          </div>

          {message && <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">{message}</div>}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Key className="w-5 h-5" />
                إعدادات الذكاء الاصطناعي (Google AI Studio)
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400 mb-4">
                في النشر على Vercel يجب وضع المفتاح في متغير البيئة `GOOGLE_API_KEY`. ويمكنك أيضًا إدخال مفتاح محلي هنا لاستخدامه من هذا المتصفح فقط عند الحاجة.
              </p>
              <form onSubmit={handleSave} className="flex gap-4 items-end">
                <div className="flex-grow mb-0">
                  <Input
                    label="Google API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="mb-0"
                  />
                </div>
                <Button type="submit" className="mb-[2px]">
                  حفظ الإعدادات
                </Button>
              </form>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-2">معلومات الحساب</h3>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">البريد الإلكتروني</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.email}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
