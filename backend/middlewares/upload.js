// /backend/middlewares/upload.js

const multer = require('multer');
const path = require('path');

// تحديد مكان التخزين واسم الملف
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // يتم حفظ الملفات في backend/uploads/works
        cb(null, path.join(__dirname, '../uploads/works')); 
    },
    filename: (req, file, cb) => {
        // تحديد اسم الملف: ID-Timestamp-OriginalName
        // سنعتمد على ID المنشور لاحقاً، لكن مبدئياً نستخدم Timestamp + Original Name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// فلترة الملفات للتأكد من أنها صور فقط
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('يُسمح برفع الصور فقط.'), false);
    }
};

// إعداد Multer لاستقبال الصور المتعددة
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // تحديد حجم أقصى 5MB
    }
});

// هذا الـ Middleware سيتم استخدامه في routes
// 'coverImage' هو اسم حقل صورة الغلاف في النموذج (ملف واحد)
// 'additionalImages' هو اسم حقل معرض الصور في النموذج (ملفات متعددة بحد أقصى 10)
const uploadFiles = upload.fields([
    { name: 'coverImage', maxCount: 1 }, 
    { name: 'additionalImages', maxCount: 10 } 
]);

module.exports = uploadFiles;