import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface LetterAttributes {
    id: number;
    userId: number;
    title: string;
    content: string;
    type: string; // 'Love', 'Gratitude', 'Apology', etc.
    isPublic: boolean;
    status: string; // 'published', 'draft', 'archived'
    scheduledDate?: Date;
    backgroundImage?: string;
    recipientName?: string;
    recipientAddress?: string;
    spotifyLink?: string;
    font?: string;
    isAnonymous?: boolean;
    imageUrl?: string;
}

interface LetterCreationAttributes extends Optional<LetterAttributes, 'id'> { }

class Letter extends Model<LetterAttributes, LetterCreationAttributes> implements LetterAttributes {
    public id!: number;
    public userId!: number;
    public title!: string;
    public content!: string;
    public type!: string;
    public isPublic!: boolean;
    public status!: string;
    public scheduledDate?: Date;
    public backgroundImage?: string;
    public recipientName?: string;
    public recipientAddress?: string;
    public spotifyLink?: string;
    public font?: string;
    public isAnonymous?: boolean;
    public imageUrl?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Letter.init(
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
                model: User,
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'General',
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'published',
        },
        scheduledDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        backgroundImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        recipientName: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        recipientAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        spotifyLink: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        font: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        isAnonymous: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        imageUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'letters',
    }
);

// Define associations
User.hasMany(Letter, { foreignKey: 'userId', as: 'letters' });
Letter.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Import and define Comment and Like associations dynamically
// This prevents circular dependency issues
const setupAssociations = async () => {
    const Comment = (await import('./Comment')).default;
    const Like = (await import('./Like')).default;

    Letter.hasMany(Comment, { foreignKey: 'letterId', as: 'comments' });
    Comment.belongsTo(Letter, { foreignKey: 'letterId', as: 'letter' });
    Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

    Letter.hasMany(Like, { foreignKey: 'letterId', as: 'likes' });
    Like.belongsTo(Letter, { foreignKey: 'letterId', as: 'letter' });
    Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
};

setupAssociations();

export default Letter;
