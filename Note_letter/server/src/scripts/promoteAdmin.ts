import dotenv from 'dotenv';
dotenv.config();

import { createInterface } from 'readline';
import sequelize from '../config/database';
import User from '../models/User';

const promoteAdmin = async () => {
    const userId = Number(process.argv[2]);
    if (!Number.isInteger(userId) || userId < 1) {
        throw new Error('Usage: npm run admin:promote -- <user-id>');
    }

    await sequelize.authenticate();
    const user = await User.findByPk(userId);
    if (!user) throw new Error('No account exists for that user ID.');

    console.log('Account selected for administrator access:');
    console.log('ID: ' + user.id);
    console.log('Username: ' + user.username);
    console.log('Email: ' + user.email);
    console.log('Verify this is the intended person through a trusted, separate channel.');
    const readline = createInterface({ input: process.stdin, output: process.stdout });
    const confirmation = await new Promise<string>((resolve) => {
        readline.question('Type PROMOTE to grant administrator access: ', (answer) => {
            readline.close();
            resolve(answer.trim());
        });
    });
    if (confirmation !== 'PROMOTE') throw new Error('Promotion cancelled.');

    user.role = 'admin';
    user.isActive = true;
    await user.save();
    console.log('Administrator access granted. The account holder must sign out and sign in again.');
};

promoteAdmin()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : 'Unable to promote administrator.');
        process.exitCode = 1;
    })
    .finally(async () => { await sequelize.close(); });
