// /backend/controllers/team.controller.js

const db = require('../models');
// استيراد نموذج Team من قاعدة البيانات
const Team = db.Team; 

// **********************************************
// ********** 1. دالة findAll (جلب الجميع) **********
// **********************************************
/**
 * جلب جميع سجلات الفريق.
 * المسار المتوقع في التوجيه (Routing): GET /api/team
 */
exports.findAll = async (req, res) => {
    try {
        // جلب جميع الأعضاء من جدول 'team'
        const teamMembers = await Team.findAll({
            // يمكنك إضافة خيارات للترتيب هنا، على سبيل المثال:
            order: [['id', 'ASC']], 
        });
        res.status(200).send(teamMembers);
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).send({ 
            message: 'حدث خطأ أثناء جلب أعضاء الفريق.', 
            error: error.message 
        });
    }
};

// ----------------------------------------------

// **********************************************
// ********** 2. دالة createTeam (الإضافة) **********
// **********************************************
/**
 * إنشاء سجل جديد في جدول الفريق.
 * المسار المتوقع في التوجيه: POST /api/team
 */
exports.createTeam = async (req, res) => {
    try {
        const { name, role } = req.body;

        // التحقق من الحقل الإلزامي 'name'
        if (!name) {
            return res.status(400).send({ message: 'حقل "name" إلزامي.' });
        }
        
        // إنشاء السجل الجديد
        const newMember = await Team.create({
            name,
            role: role || null,
        });

        res.status(201).send({ 
            message: 'تمت إضافة عضو الفريق بنجاح.', 
            teamMember: newMember 
        });

    } catch (error) {
        console.error("Error inside createTeam:", error);
        res.status(500).send({ 
            message: 'فشل حفظ البيانات.', 
            errorDetails: error.message 
        });
    }
};

// ----------------------------------------------

// **********************************************
// ********** 3. دالة deleteTeam (الحذف) **********
// **********************************************
/**
 * حذف سجل فريق بناءً على المعرّف (ID).
 * المسار المتوقع في التوجيه: DELETE /api/team/:id
 */
exports.deleteTeam = async (req, res) => {
    const id = req.params.id;

    try {
        // حذف السجل الذي يطابق المعرّف
        const num = await Team.destroy({ 
            where: { id: id } 
        });

        if (num === 1) {
            res.send({ message: "تم حذف عضو الفريق بنجاح!" });
        } else {
            // السجل غير موجود
            res.status(404).send({ 
                message: `لا يمكن حذف عضو الفريق ذو المعرف ${id}. قد يكون غير موجود.` 
            });
        }
    } catch (error) {
        console.error("Error inside deleteTeam:", error);
        res.status(500).send({ 
            message: "حدث خطأ أثناء الحذف.", 
            errorDetails: error.message 
        });
    }
};

// ----------------------------------------------

// **********************************************
// ********** دوال أخرى (غير متاحة حاليًا) **********
// **********************************************
// يمكن إزالتها أو تعديلها لاحقاً حسب حاجتك
exports.findOne = (req, res) => {
    res.status(405).send({ message: 'الوصول لوظيفة الجلب المفرد (findOne) غير متاح في هذا الإصدار.' });
};
exports.updateTeam = (req, res) => {
    res.status(405).send({ message: 'الوصول لوظيفة التعديل (updateTeam) غير متاح في هذا الإصدار.' });
};