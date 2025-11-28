// /backend/models/settings.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Setting = sequelize.define('Setting', {
        key: { type: DataTypes.STRING(50), primaryKey: true },
        value: { type: DataTypes.STRING(255), allowNull: true },
        description: { type: DataTypes.STRING(255), allowNull: true }
    }, {
        tableName: 'settings',
        timestamps: false,
    });
    return Setting;
};