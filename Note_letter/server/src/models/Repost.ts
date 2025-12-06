import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Letter from './Letter';

interface RepostAttributes {
    id: number;
    userId: number;
    letterId: number;
}

interface RepostCreationAttributes extends Optional<RepostAttributes, 'id'> { }

class Repost extends Model<RepostAttributes, RepostCreationAttributes> implements RepostAttributes {
    public id!: number;
    public userId!: number;
    public letterId!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Repost.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    letterId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: Letter,
            key: 'id',
        },
    },
}, {
    sequelize,
    modelName: 'Repost',
    tableName: 'reposts',
});

// Associations
User.hasMany(Repost, { foreignKey: 'userId', as: 'reposts' });
Repost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Letter.hasMany(Repost, { foreignKey: 'letterId', as: 'reposts' });
Repost.belongsTo(Letter, { foreignKey: 'letterId', as: 'letter' });

export default Repost;
