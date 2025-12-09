import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface FriendAttributes {
    id: number;
    requesterId: number;
    recipientId: number;
    status: 'pending' | 'accepted' | 'rejected';
}

interface FriendCreationAttributes extends Omit<FriendAttributes, 'id'> { }

class Friend extends Model<FriendAttributes, FriendCreationAttributes> implements FriendAttributes {
    public id!: number;
    public requesterId!: number;
    public recipientId!: number;
    public status!: 'pending' | 'accepted' | 'rejected';
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Friend.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        requesterId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        recipientId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            defaultValue: 'pending',
        },
    },
    {
        sequelize,
        tableName: 'friends',
    }
);

// Associations
User.hasMany(Friend, { foreignKey: 'requesterId', as: 'sentRequests' });
User.hasMany(Friend, { foreignKey: 'recipientId', as: 'receivedRequests' });
Friend.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Friend.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

export default Friend;
