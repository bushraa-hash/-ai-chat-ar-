# AI Chat AR

تطبيق دردشة عربي مبني بـ React و Vite و Supabase و Gemini، مع نشر مناسب على Vercel عبر دالة `api/chat`.

## ما الذي تم إصلاحه

- نقل استدعاء Gemini في بيئة الإنتاج من المتصفح إلى دالة Vercel داخل `api/chat.js`.
- تحسين رسائل الخطأ عند تجاوز الحصة `429` بحيث تظهر للمستخدم رسالة عربية واضحة بدل الخطأ الخام الطويل.
- تقليل استهلاك الحصة عبر تخفيف طلبات استخراج الذاكرة الخلفية.
- إضافة صفحة فعلية لإعادة تعيين كلمة المرور.
- إصلاح النصوص العربية المكسورة ومشاكل `lint` و`build`.

## متغيرات البيئة

أنشئ ملف `.env` محليًا اعتمادًا على `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_API_KEY=your-google-api-key
```

مهم:

- في الواجهة الأمامية نحتاج `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`.
- مفتاح Gemini في النشر يجب أن يكون باسم `GOOGLE_API_KEY` وليس `VITE_GOOGLE_API_KEY`.
- إذا كنت قد استخدمت مفتاح Gemini قديمًا داخل المتصفح أو رفعته سابقًا، من الأفضل تدويره `Rotate` من Google AI Studio وإنشاء مفتاح جديد.

## التشغيل المحلي

للوضع الأمثل الذي يشبه Vercel:

```bash
vercel dev
```

وللتطوير السريع عبر Vite فقط:

```bash
npm install
npm run dev
```

في وضع `npm run dev` فقط، إذا لم تكن دالة `/api/chat` متاحة، سيستخدم التطبيق المفتاح المحلي المحفوظ في المتصفح كخطة بديلة.

## أوامر التحقق

```bash
npm run lint
npm run build
```

## خطوات النشر على GitHub و Vercel

1. تأكد أن ملف `.env` غير مرفوع إلى GitHub.
2. ارفع الكود إلى GitHub.
3. افتح مشروعك في Vercel.
4. من `Settings -> Environment Variables` أضف:
   - `GOOGLE_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. أعد النشر `Redeploy`.

## ملاحظة عن خطأ الحصة

إذا ظهرت رسالة `429 Quota exceeded` فهذا يعني أن الحصة الحالية لمفتاح Gemini انتهت أو تم الوصول لحد الطلبات. لا يمكن إصلاح ذلك برمجيًا بالكامل وحده. الحلول الصحيحة هي:

- الانتظار حتى يعاد فتح الحصة.
- تفعيل الفوترة أو ترقية الخطة في Google AI Studio.
- استخدام مفتاح API آخر يملك حصة متاحة.

التطبيق الآن يعرض هذه الحالة برسالة أوضح ويتعامل معها بشكل أفضل، لكن لا يستطيع تجاوز حدود Google نفسها.
