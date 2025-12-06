const mysql = require('mysql2/promise');

async function addTimeCapsuleColumns() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'note_letter_db2'
    });

    try {
        console.log('Adding time capsule columns to letters table...');

        await connection.execute(`
            ALTER TABLE letters 
            ADD COLUMN IF NOT EXISTS openDate DATETIME NULL
        `);
        console.log('✓ Added openDate column');

        await connection.execute(`
            ALTER TABLE letters 
            ADD COLUMN IF NOT EXISTS isTimeCapsule TINYINT(1) DEFAULT 0
        `);
        console.log('✓ Added isTimeCapsule column');

        console.log('\n✅ All time capsule columns added successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

addTimeCapsuleColumns();
