"use strict";
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
const bcrypt_1 = __importDefault(require("bcrypt"));
class User extends sequelize_1.Model {
    // Method to check password
    validatePassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield bcrypt_1.default.compare(password, this.password_hash);
        });
    }
}
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: false,
        unique: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password_hash: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: false,
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    coverImage: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    tableName: 'users',
});
// Hook to hash password before saving
User.beforeCreate((user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.password_hash) {
        const salt = yield bcrypt_1.default.genSalt(10);
        user.password_hash = yield bcrypt_1.default.hash(user.password_hash, salt);
    }
}));
User.beforeUpdate((user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.changed('password_hash')) {
        const salt = yield bcrypt_1.default.genSalt(10);
        user.password_hash = yield bcrypt_1.default.hash(user.password_hash, salt);
    }
}));
exports.default = User;
