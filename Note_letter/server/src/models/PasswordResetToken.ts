import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ResetAttributes {
    id: number;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
    createdAt: Date;
}
type ResetCreation = Optional<ResetAttributes, 'id' | 'consumedAt' | 'createdAt'>;

class PasswordResetToken extends Model<ResetAttributes, ResetCreation> implements ResetAttributes {
    declare id: number;
    declare userId: number;
    declare tokenHash: string;
    declare expiresAt: Date;
    declare consumedAt: Date | null;
    declare createdAt: Date;
}

PasswordResetToken.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    tokenHash: { type: DataTypes.STRING(64), unique: true, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'password_reset_tokens', createdAt: true, updatedAt: false });

export default PasswordResetToken;
