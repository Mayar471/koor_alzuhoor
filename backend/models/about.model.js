// /backend/models/about.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const About = sequelize.define('About', {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        description_ar: { type: DataTypes.TEXT('long'), allowNull: true },
        description_en: { type: DataTypes.TEXT('long'), allowNull: true },
        description_de: { type: DataTypes.TEXT('long'), allowNull: true },
        vision_ar: { type: DataTypes.TEXT, allowNull: true },
        vision_en: { type: DataTypes.TEXT, allowNull: true },
        vision_de: { type: DataTypes.TEXT, allowNull: true },
        team_photo_url: { type: DataTypes.STRING(255), allowNull: true }
    }, {
        tableName: 'about',
        timestamps: false,
    });
    return About;
};