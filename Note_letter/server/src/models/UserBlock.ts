import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BlockAttributes {
    id: number;
    blockerId: number;
    blockedId: number;
    createdAt: Date;
}
type BlockCreation = Optional<BlockAttributes, 'id' | 'createdAt'>;
class UserBlock extends Model<BlockAttributes, BlockCreation> implements BlockAttributes {
    declare id: number;
    declare blockerId: number;
    declare blockedId: number;
    declare createdAt: Date;
}
UserBlock.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    blockerId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    blockedId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'user_blocks', createdAt: true, updatedAt: false });

export default UserBlock;
