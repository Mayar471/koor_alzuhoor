// /backend/controllers/auth.controller.js (النسخة النهائية المصححة)

const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = db.Admin;

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'البريد وكلمة المرور مطلوبان.' });
    }

    try {
        // 1. البحث عن المدير بالبريد الإلكتروني
        const admin = await Admin.findOne({ where: { email } });

        if (!admin) {
            // 🛑 تصحيح: يجب استخدام res.status(401).send(BODY)
            return res.status(401).send({ message: 'البريد الإلكتروني غير صحيح.' });
        }

        // 2. مقارنة كلمة المرور المشفرة
        const passwordIsValid = await bcrypt.compare(password, admin.password_hash);

        if (!passwordIsValid) {
            // 🛑 تصحيح: يجب استخدام res.status(401).send(BODY)
            return res.status(401).send({ message: 'كلمة المرور غير صحيحة.' });
        }

        // 3. إنشاء توكن (JWT) للجلسة
        const token = jwt.sign(
            { id: admin.id },
            process.env.JWT_SECRET,
            { expiresIn: '12h' } // انتهاء صلاحية التوكن بعد 12 ساعة
        );

        // 4. إرسال التوكن وبعض بيانات المدير للـ Frontend
        res.status(200).send({
            message: 'تم تسجيل الدخول بنجاح.',
            token: token,
            admin: {
                id: admin.id,
                full_name: admin.full_name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("CRITICAL LOGIN ERROR:", error);
        return res.status(500).send({ message: 'حدث خطأ داخلي في الخادم.', error: error.message });
    }
};

// ... (الدوال الأخرى، لم يتم تغييرها لأن التركيز على دالة login)
exports.testAuth = (req, res) => {
    res.status(200).send({ message: 'تم التحقق من التوكن بنجاح! مرحباً ' + req.adminId });
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.adminId;

        if (!currentPassword || !newPassword) {
            return res.status(400).send({ message: "يرجى إدخال كلمة المرور الحالية والجديدة." });
        }

        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).send({ message: "المستخدم غير موجود." });
        }

        const passwordIsValid = bcrypt.compareSync(currentPassword, admin.password_hash);
        if (!passwordIsValid) {
            return res.status(401).send({ message: "كلمة المرور الحالية غير صحيحة." });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 8);
        await admin.update({ password_hash: hashedPassword });

        res.send({ message: "تم تغيير كلمة المرور بنجاح!" });

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};