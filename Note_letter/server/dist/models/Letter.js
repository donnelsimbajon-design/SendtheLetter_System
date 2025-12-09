"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
class Letter extends sequelize_1.Model {
}
Letter.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
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
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'General',
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        defaultValue: 'published',
    },
    scheduledDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    backgroundImage: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    recipientName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    recipientAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    spotifyLink: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    font: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    isAnonymous: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    openDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isTimeCapsule: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'letters',
});
// Define associations
User_1.default.hasMany(Letter, { foreignKey: 'userId', as: 'letters' });
Letter.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
// Import and define Comment and Like associations dynamically
// This prevents circular dependency issues
const setupAssociations = () => __awaiter(void 0, void 0, void 0, function* () {
    const Comment = (yield Promise.resolve().then(() => __importStar(require('./Comment')))).default;
    const Like = (yield Promise.resolve().then(() => __importStar(require('./Like')))).default;
    Letter.hasMany(Comment, { foreignKey: 'letterId', as: 'comments' });
    Comment.belongsTo(Letter, { foreignKey: 'letterId', as: 'letter' });
    Comment.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
    User_1.default.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
    Letter.hasMany(Like, { foreignKey: 'letterId', as: 'likes' });
    Like.belongsTo(Letter, { foreignKey: 'letterId', as: 'letter' });
    Like.belongsTo(User_1.default, { foreignKey: 'userId', as: 'user' });
    User_1.default.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
});
setupAssociations();
exports.default = Letter;
