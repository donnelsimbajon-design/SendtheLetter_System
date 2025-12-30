import sequelize from './config/database';
import { Op } from 'sequelize';
import Letter from './models/Letter';

const checkImages = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const letters = await Letter.findAll({
            where: { imageUrl: { [Op.ne]: null } },
            attributes: ['id', 'title', 'imageUrl'],
            limit: 5
        });

        console.log(`Found ${letters.length} letters with images`);
        letters.forEach(letter => {
            const imageUrl = letter.imageUrl || '';
            console.log(`\nLetter ${letter.id} - ${letter.title}`);
            console.log(`Image URL length: ${imageUrl.length}`);
            console.log(`Image URL preview: ${imageUrl.substring(0, 100)}...`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkImages();
