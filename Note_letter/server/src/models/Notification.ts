import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
    id: number;
    userId: number; // Recipient
    actorId: number; // Who triggered it
    type: string;
    entityId: number; // Identifier within notification type (letter, follow or friend request)
    letterId?: number | null; // Only populated for letter-related notifications
    isRead: boolean;
}

interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'isRead' | 'letterId'> { letterId?: number | null }

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: number;
    public userId!: number;
    public actorId!: number;
    public type!: string;
    public entityId!: number;
    public letterId?: number | null;
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
            type: DataTypes.STRING, // Changed from ENUM to allow easier updates
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        letterId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'letters', key: 'id' },
            onDelete: 'SET NULL',
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
