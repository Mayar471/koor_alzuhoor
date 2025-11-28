// /backend/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/authJwt');
// مسار تسجيل الدخول
router.post('/login', authController.login);
router.post('/change-password', [verifyToken], authController.changePassword);
module.exports = router;