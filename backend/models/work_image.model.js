// /backend/models/work_image.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkImage = sequelize.define('WorkImage', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        work_id: { type: DataTypes.INTEGER, allowNull: false }, // سيتم ربطه في index.js
        image_url: { type: DataTypes.STRING(255), allowNull: false },
        alt_ar: { type: DataTypes.STRING(255), allowNull: true },
        alt_en: { type: DataTypes.STRING(255), allowNull: true },
        alt_de: { type: DataTypes.STRING(255), allowNull: true },
    }, {
        tableName: 'work_images',
        timestamps: false,
    });
    return WorkImage;
};