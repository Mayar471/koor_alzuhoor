// /backend/scripts/create-admin.js

const path = require('path'); // لضمان العثور على المسار الصحيح
// ضمان تحميل ملف .env من المجلد الأب (..). يجب أن تكون هذه الأولوية.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') }); 

const bcrypt = require('bcrypt');
const db = require('../models');

// بيانات المدير الأول
const DEFAULT_ADMIN_EMAIL = 'admin@kooralzuhur.com';
const DEFAULT_ADMIN_PASSWORD = 'password123'; // قم بتغييرها فوراً بعد تسجيل الدخول الأول!

const createFirstAdmin = async () => {
    try {
        // التحقق مما إذا كان هناك أي مدير موجود بالفعل
        const existingAdmin = await db.Admin.findOne({ where: { email: DEFAULT_ADMIN_EMAIL } });

        if (existingAdmin) {
            console.log(`\n⚠️ حساب المدير '${DEFAULT_ADMIN_EMAIL}' موجود بالفعل. تخطي عملية الإنشاء.`);
            return;
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        
        // إنشاء السجل في قاعدة البيانات
        await db.Admin.create({
            email: DEFAULT_ADMIN_EMAIL,
            password_hash: hashedPassword,
            full_name: 'Super Admin',
        });

        console.log(`\n🎉 تم إنشاء أول حساب مدير بنجاح!`);
        console.log(`📧 الإيميل: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`🔒 كلمة المرور: ${DEFAULT_ADMIN_PASSWORD} (يرجى تغييرها بعد تسجيل الدخول!)`);

    } catch (error) {
        console.error('❌ فشل في إنشاء حساب المدير الأول:', error.message);
    } finally {
        // إغلاق الاتصال بقاعدة البيانات
        await db.sequelize.close();
    }
};

// يجب مزامنة الجداول قبل محاولة الإنشاء
db.sync().then(() => {
    createFirstAdmin();
});