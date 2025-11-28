const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// التأكد من تحميل .env في حال تم استدعاء هذا الملف بشكل منفصل
dotenv.config();

// إنشاء نسخة (Instance) من Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // تعيين إلى true لرؤية استعلامات SQL في الطرفية
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // إعداد الترميز لضمان دعم اللغة العربية والرموز
    dialectOptions: {
      charset: 'utf8mb4'
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    }
  }
);

// اختبار الاتصال (يتم تنفيذه في server.js)
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connection has been established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        process.exit(1); // إيقاف الخادم في حالة فشل الاتصال
    }
};

module.exports = { sequelize, connectDB };