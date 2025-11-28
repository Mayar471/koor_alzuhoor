// /backend/routes/team.routes.js

const express = require('express');
const router = express.Router(); // إنشاء راوتر جديد
const teamController = require('../controllers/team.controller');
const { verifyToken } = require('../middlewares/authJwt'); // وسيط المصادقة

// **********************************************
// ********** التوجيهات العامة (Public Routes) **********
// **********************************************

// **GET /api/team**
// جلب جميع أعضاء الفريق (findAll) - لا يتطلب مصادقة
router.get('/', teamController.findAll); 

// **********************************************
// ********** التوجيهات المحمية (Protected Routes) **********
// **********************************************

// **POST /api/team**
// إضافة عضو جديد - يتطلب مصادقة (verifyToken)
router.post(
    '/', 
    [verifyToken], // تطبيق وسيط المصادقة قبل الإضافة
    teamController.createTeam
);

// **DELETE /api/team/:id**
// حذف عضو - يتطلب مصادقة (verifyToken)
router.delete(
    '/:id', 
    [verifyToken], // تطبيق وسيط المصادقة قبل الحذف
    teamController.deleteTeam
); 

// **********************************************
// ********** تصدير الراوتر **********
// **********************************************

module.exports = router;