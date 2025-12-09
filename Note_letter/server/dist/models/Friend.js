"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Friend extends sequelize_1.Model {
}
Friend.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    requesterId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id',
        },
    },
    recipientId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id',
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
    },
}, {
    sequelize: database_1.default,
    tableName: 'friends',
});
// Associations
User_1.default.hasMany(Friend, { foreignKey: 'requesterId', as: 'sentRequests' });
User_1.default.hasMany(Friend, { foreignKey: 'recipientId', as: 'receivedRequests' });
Friend.belongsTo(User_1.default, { foreignKey: 'requesterId', as: 'requester' });
Friend.belongsTo(User_1.default, { foreignKey: 'recipientId', as: 'recipient' });
exports.default = Friend;
