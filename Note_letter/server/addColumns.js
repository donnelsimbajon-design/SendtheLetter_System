const mysql = require('mysql2/promise');

async function addColumns() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'note_letter_db2'
    });

    try {
        console.log('Adding location columns to letters table...');

        await connection.execute(`
            ALTER TABLE letters 
            ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL
        `);
        console.log('✓ Added address column');

        await connection.execute(`
            ALTER TABLE letters 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL
        `);
        console.log('✓ Added latitude column');

        await connection.execute(`
            ALTER TABLE letters 
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL
        `);
        console.log('✓ Added longitude column');

        console.log('\n✅ All columns added successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

addColumns();
