import sequelize from './config/database';
import User from './models/User';

const checkUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        const users = await User.findAll();
        console.log('Users found:', users.map(u => ({ id: u.id, username: u.username })));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkUsers();
