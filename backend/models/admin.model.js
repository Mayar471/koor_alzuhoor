// /backend/models/admin.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
        full_name: { type: DataTypes.STRING(100), allowNull: true },
        phone_number: { type: DataTypes.STRING(20), allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'admins',
        timestamps: false,
    });
    return Admin;
};