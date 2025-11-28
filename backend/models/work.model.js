// /backend/models/work.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Work = sequelize.define('Work', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        
        // حقول المحتوى باللغات الثلاث
        title_ar: { type: DataTypes.STRING(255), allowNull: false },
        title_en: { type: DataTypes.STRING(255), allowNull: false },
        title_de: { type: DataTypes.STRING(255), allowNull: false },
        summary_ar: { type: DataTypes.TEXT, allowNull: true },
        summary_en: { type: DataTypes.TEXT, allowNull: true },
        summary_de: { type: DataTypes.TEXT, allowNull: true },
        content_ar: { type: DataTypes.TEXT('long'), allowNull: true },
        content_en: { type: DataTypes.TEXT('long'), allowNull: true },
        content_de: { type: DataTypes.TEXT('long'), allowNull: true },

        // الصور والروابط
        cover_image_url: { type: DataTypes.STRING(255), allowNull: true },
        cover_image_alt_ar: { type: DataTypes.STRING(255), allowNull: true },
        cover_image_alt_en: { type: DataTypes.STRING(255), allowNull: true },
        cover_image_alt_de: { type: DataTypes.STRING(255), allowNull: true },
        facebook_link: { type: DataTypes.STRING(255), allowNull: true },
        instagram_link: { type: DataTypes.STRING(255), allowNull: true },
        
        // حقول التمييز والفلترة
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_festival_work: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_news: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_timeline_event: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_ticker: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_article: { type: DataTypes.BOOLEAN, defaultValue: false },
        // حقول التاريخ
        production_year: { type: DataTypes.STRING(50), allowNull: true },
        publication_date: { type: DataTypes.DATEONLY, allowNull: true },
        date_ar_display: { type: DataTypes.STRING(50), allowNull: true },
        date_en_display: { type: DataTypes.STRING(50), allowNull: true },
        date_de_display: { type: DataTypes.STRING(50), allowNull: true },
    }, {
        tableName: 'works',
        timestamps: false,
    });
    return Work;
};