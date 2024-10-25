# استخدام Node.js كصورة أساسية
FROM node:18-alpine

# تعيين متغير البيئة لبيئة الإنتاج
ENV NODE_ENV=production

# تعيين دليل العمل داخل الحاوية
WORKDIR /app

# نسخ ملف package.json و package-lock.json إلى دليل العمل
COPY package*.json ./

# تثبيت التبعيات
RUN npm install --production

# نسخ باقي ملفات المشروع إلى الحاوية
COPY . .

# تعيين المنفذ الذي سيستمع عليه التطبيق
EXPOSE 8900

# أمر التشغيل الافتراضي لتشغيل الخادم
CMD ["node", "server.js"]
