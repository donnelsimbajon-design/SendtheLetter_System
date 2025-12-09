"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const Letter_1 = __importDefault(require("./Letter"));
class Repost extends sequelize_1.Model {
}
Repost.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id',
        },
    },
    letterId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: Letter_1.default,
            key: 'id',
        },
    },
}, {
    sequelize: database_1.default,
    modelName: 'Repost',
    tableName: 'reposts',
});
// Associations
User_1.default.hasMany(Repost, { foreignKey: 'userId', as: 'reposts' });
Repost.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
Letter_1.default.hasMany(Repost, { foreignKey: 'letterId', as: 'reposts' });
Repost.belongsTo(Letter_1.default, { foreignKey: 'letterId', as: 'letter' });
exports.default = Repost;
