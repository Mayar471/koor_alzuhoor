// /backend/models/team.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Team = sequelize.define('Team', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        role: { type: DataTypes.STRING(20), allowNull: true },
    }, 
    {
        tableName: 'team',
        timestamps: false,
    });
    return Team;
};