// /backend/routes/works.routes.js

const express = require('express');
const router = express.Router();
const worksController = require('../controllers/works.controller');
const { verifyToken } = require('../middlewares/authJwt');
// ⚠️ إضافة استيراد ملف الرفع
const uploadFiles = require('../middlewares/upload'); 

// جلب جميع المنشورات (محمي بـ verifyToken)
router.get('/', [verifyToken], worksController.findAll);
router.get('/:id', [verifyToken], worksController.findOne);

// ⚠️ مسار إضافة منشور جديد: يستخدم verifyToken و uploadFiles
router.post(
    '/', 
    [verifyToken, uploadFiles], // يتم معالجة التوكن ورفع الصور أولاً
    worksController.createWork
); 
router.put(
    '/:id', 
    [verifyToken, uploadFiles], 
    worksController.updateWork
);
router.delete('/:id', [verifyToken], worksController.deleteWork); // يحتاج ID المنشور
module.exports = router;