import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api/auth';

async function testProfileUpdate() {
    try {
        // 1. Register a new user
        const username = `testuser_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = 'password123';

        console.log('Registering user:', username);
        await axios.post(`${API_URL}/register`, {
            username,
            email,
            password
        });

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 3. Create a dummy file
        const dummyFilePath = path.join(__dirname, 'test-image.png');
        if (!fs.existsSync(dummyFilePath)) {
            fs.writeFileSync(dummyFilePath, 'fake image content');
        }

        // 4. Update profile
        console.log('Updating profile...');
        const form = new FormData();
        form.append('bio', 'Updated bio from test script');
        form.append('avatar', fs.createReadStream(dummyFilePath));

        const updateRes = await axios.put(`${API_URL}/profile`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Update success:', updateRes.data);

    } catch (error: any) {
        console.error('Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testProfileUpdate();
