import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface FollowAttributes {
    id: number;
    followerId: number; // User who is following
    followingId: number; // User being followed
}

interface FollowCreationAttributes extends Omit<FollowAttributes, 'id'> { }

class Follow extends Model<FollowAttributes, FollowCreationAttributes> implements FollowAttributes {
    public id!: number;
    public followerId!: number;
    public followingId!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Follow.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        followerId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        followingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'follows',
    }
);

// Both directions must be registered before controllers use Sequelize eager loading.
// These associations describe existing foreign keys; they do not alter the database.
User.hasMany(Follow, { foreignKey: 'followerId', as: 'outgoingFollows' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'incomingFollows' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

export default Follow;
