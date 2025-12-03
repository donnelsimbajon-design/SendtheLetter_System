import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
    id: number;
    userId: number; // Recipient
    actorId: number; // Who triggered it
    type: 'comment' | 'like';
    entityId: number; // ID of the letter
    isRead: boolean;
}

interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'isRead'> { }

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: number;
    public userId!: number;
    public actorId!: number;
    public type!: 'comment' | 'like';
    public entityId!: number;
    public isRead!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        actorId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM('comment', 'like'),
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'notifications',
    }
);

export default Notification;
