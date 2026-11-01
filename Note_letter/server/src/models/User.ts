import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

export type UserRole = 'user' | 'admin';

interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    role: UserRole;
    isActive: boolean;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    location?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public email!: string;
    public password_hash!: string;
    public role!: UserRole;
    public isActive!: boolean;
    public bio?: string;
    public avatar?: string;
    public coverImage?: string;
    public location?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password_hash);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
            validate: { len: [2, 128] },
        },
        email: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password_hash: {
            type: DataTypes.STRING(128),
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'user',
            validate: { isIn: [['user', 'admin']] },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        bio: { type: DataTypes.TEXT, allowNull: true },
        avatar: { type: DataTypes.STRING(255), allowNull: true },
        coverImage: { type: DataTypes.STRING(255), allowNull: true },
        location: { type: DataTypes.STRING(128), allowNull: true },
    },
    { sequelize, tableName: 'users' }
);

User.beforeCreate(async (user) => {
    if (user.password_hash) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
    }
});

export default User;
