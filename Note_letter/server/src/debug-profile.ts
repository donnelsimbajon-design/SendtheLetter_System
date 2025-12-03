import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api/auth';

async function debugProfile() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        // Use a known user or create one. Let's try to create one to be safe.
        const username = `debug_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = 'password123';

        try {
            await axios.post(`${API_URL}/register`, { username, email, password });
        } catch (e) {
            // Ignore if exists, try login
        }

        const loginRes = await axios.post(`${API_URL}/login`, { email, password });
        const token = loginRes.data.token;
        console.log('Token obtained.');

        // 2. Create dummy image
        const dummyPath = path.join(__dirname, 'debug.png');
        fs.writeFileSync(dummyPath, 'fake image');

        // 3. Update profile
        console.log('Sending update request...');
        const form = new FormData();
        form.append('bio', 'Debug bio');
        form.append('avatar', fs.createReadStream(dummyPath));

        try {
            const res = await axios.put(`${API_URL}/profile`, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Success:', res.data);
        } catch (err: any) {
            console.log('----------------------------------------');
            console.log('ERROR RESPONSE STATUS:', err.response?.status);
            console.log('ERROR RESPONSE DATA:', JSON.stringify(err.response?.data, null, 2));
            console.log('----------------------------------------');
        }

    } catch (error: any) {
        console.error('Setup error:', error.message);
        if (error.response) {
            console.error('Setup response:', error.response.data);
        }
    }
}

debugProfile();
