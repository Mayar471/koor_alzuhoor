// /backend/models/index.js
const { sequelize } = require('../config/db.config');

const db = {};

db.sequelize = sequelize;

// 1. تحميل النماذج (Models)
db.Admin = require('./admin.model')(sequelize);
db.Team = require('./team.model')(sequelize);
db.Setting = require('./settings.model')(sequelize);
db.About = require('./about.model')(sequelize);
db.Work = require('./work.model')(sequelize);
db.WorkImage = require('./work_image.model')(sequelize);

// 2. تعريف العلاقات (Relationships)

// Work (العمل/المنشور) له عدة صور (WorkImages) - علاقة One-to-Many
db.Work.hasMany(db.WorkImage, {
    as: 'images', // الاسم المستخدم عند جلب البيانات (مثل include: [{model: WorkImage, as: 'images'}])
    foreignKey: 'work_id',
    onDelete: 'CASCADE' // عند حذف العمل، تحذف جميع صوره المرتبطة به
});

db.WorkImage.belongsTo(db.Work, {
    foreignKey: 'work_id',
    as: 'work'
});


// 3. دالة مزامنة الجداول
db.sync = async () => {
    // نستخدم alter: true لتعديل الجداول الحالية دون حذف البيانات
    // هذا آمن في مرحلة التطوير
    await sequelize.sync(); 
    console.log("✅ All models were synchronized successfully.");
};

module.exports = db;