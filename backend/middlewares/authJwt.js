// /backend/middlewares/authJwt.js

const jwt = require('jsonwebtoken');

// وظيفة Middleware للتحقق من التوكن (Token)
const verifyToken = (req, res, next) => {
    // 1. جلب التوكن من الـ Header (عادة يكون 'Bearer [token]')
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // خطأ 403: ممنوع
        return res.status(403).send({ message: 'الوصول غير مصرح به. (لم يتم تقديم توكن)' });
    }

    const token = authHeader.split(' ')[1]; // استخراج التوكن

    // 2. التحقق من صحة التوكن
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // خطأ 401: غير مصرح به
            return res.status(401).send({ message: 'غير مصرح به. (التوكن غير صالح أو منتهي الصلاحية)' });
        }
        
        // 3. تخزين معرّف المدير في الـ Request والاستمرار
        req.adminId = decoded.id;
        next(); 
    });
};

const authJwt = {
    verifyToken: verifyToken
};

module.exports = authJwt;