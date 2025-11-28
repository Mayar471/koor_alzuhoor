// /backend/routes/public.routes.js

const express = require('express');
const router = express.Router();
const worksController = require('../controllers/works.controller');

// 1. مسار جلب جميع الأعمال (عام - لا يتطلب مصادقة)
// Route: GET /api/public/works
router.get('/works', worksController.findAll);

// 2. مسار جلب تفاصيل عمل واحد بالـ ID (عام - لا يتطلب مصادقة)
// Route: GET /api/public/works/:id
router.get('/works/:id', worksController.findOne);

// يمكن إضافة مسارات عامة أخرى هنا (مثل معلومات "عن الفرقة")

module.exports = router;