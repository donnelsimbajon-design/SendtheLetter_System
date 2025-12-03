import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

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

export default Follow;
