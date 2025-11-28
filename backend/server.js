// /backend/server.js
// ------------------------------------------------

// 1. تحميل الحزم الأساسية
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // استيراد وحدة path

const { connectDB } = require('./config/db.config'); 
const db = require('./models'); 
const authRoutes = require('./routes/auth.routes'); 
const worksRoutes = require('./routes/works.routes');
const publicRoutes = require('./routes/public.routes'); 
const teamRoutes = require('./routes/team.routes');
// تحميل إعدادات البيئة من ملف .env
dotenv.config();

// تهيئة تطبيق Express
const app = express();

// 2. تطبيق الـ Middlewares الأساسية
app.use(express.json()); // للسماح للخادم باستقبال بيانات JSON
app.use(express.urlencoded({ extended: true })); // للتعامل مع البيانات من الفورم
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// ⚠️⚠️ أضف هذا السطر لتفعيل الوصول لمجلد الصور (للأدمن والمستخدم) ⚠️⚠️
// هذا يعني: أي رابط يبدأ بـ /uploads، ابحث عنه في مجلد backend/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------------------------------------
// 3. مسارات الـ API (المحمية وغير المحمية)
// ------------------------------------------------
// المسارات المحمية للـ Control Panel
app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/team', teamRoutes);

// مسارات الـ API العامة (للمستخدم)
app.use('/api/public', publicRoutes);


// ------------------------------------------------
// 4. خدمة الواجهات الأمامية (Frontend)
// ------------------------------------------------

// أ. خدمة واجهة لوحة التحكم (Admin Panel)
// يمكن الوصول لصفحاتها عبر /admin/index.html
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));

// ب. خدمة واجهة المستخدم (Public Frontend)
// هذا السطر يخدم جميع ملفات CSS و JS والصور في مجلد frontend مباشرة
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// ------------------------------------------------
// 5. مسارات الصفحات الرئيسية (HTML Routes)
// ------------------------------------------------

// مسار الصفحة الرئيسية للمستخدم (http://localhost:PORT/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// مسارات الصفحات الأخرى (للسماح بالوصول المباشر دون /index.html)
app.get('/works.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'works.html'));
});

app.get('/maghout.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'maghout.html'));
});

app.get('/single-item.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'single-item.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'contact.html'));
});


// ------------------------------------------------
// 6. تشغيل الخادم
// ------------------------------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`\nServer is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Access Admin Panel at: http://localhost:${PORT}/admin/index.html`);
    console.log(`Access Public Site at: http://localhost:${PORT}`);
    connectDB();
    db.sync();
});