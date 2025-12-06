// Test script for enhanced letter features
// Run with: node testEnhancedFeatures.js

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = ''; // You'll need to login first to get a token

async function testBackend() {
    console.log('🧪 Testing Enhanced Letter Features Backend\n');

    try {
        // Test 1: Create a draft
        console.log('1️⃣ Testing: Create Draft');
        const draftResponse = await axios.post(`${API_URL}/letters`, {
            title: 'Test Draft Letter',
            content: 'This is a test draft',
            status: 'draft',
            type: 'Other',
            isPublic: false
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Draft created:', draftResponse.data.letter.id);
        const draftId = draftResponse.data.letter.id;

        // Test 2: Update the draft
        console.log('\n2️⃣ Testing: Update Draft');
        await axios.put(`${API_URL}/letters/drafts/${draftId}`, {
            title: 'Updated Draft Title',
            content: 'Updated content'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Draft updated successfully');

        // Test 3: Get drafts
        console.log('\n3️⃣ Testing: Get Drafts');
        const draftsResponse = await axios.get(`${API_URL}/letters/drafts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Fetched drafts:', draftsResponse.data.length, 'found');

        // Test 4: Create scheduled letter
        console.log('\n4️⃣ Testing: Create Scheduled Letter');
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + 24); // 24 hours from now

        const scheduledResponse = await axios.post(`${API_URL}/letters`, {
            title: 'Scheduled Letter',
            content: 'This will be published tomorrow',
            scheduledDate: futureDate.toISOString(),
            status: 'published',
            type: 'Other',
            isPublic: true
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Scheduled letter created:', scheduledResponse.data.letter.id);

        // Test 5: Get scheduled letters
        console.log('\n5️⃣ Testing: Get Scheduled Letters');
        const scheduledListResponse = await axios.get(`${API_URL}/letters/scheduled`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Fetched scheduled letters:', scheduledListResponse.data.length, 'found');

        // Test 6: Create time capsule
        console.log('\n6️⃣ Testing: Create Time Capsule');
        const capsuleDate = new Date();
        capsuleDate.setDate(capsuleDate.getDate() + 7); // 7 days from now

        const capsuleResponse = await axios.post(`${API_URL}/letters`, {
            title: 'Time Capsule Letter',
            content: 'This will unlock in 7 days',
            openDate: capsuleDate.toISOString(),
            isTimeCapsule: true,
            status: 'published',
            type: 'Other',
            isPublic: false
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Time capsule created:', capsuleResponse.data.letter.id);

        // Test 7: Get time capsules
        console.log('\n7️⃣ Testing: Get Time Capsules');
        const capsulesResponse = await axios.get(`${API_URL}/letters/time-capsules`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Fetched time capsules:', capsulesResponse.data.length, 'found');

        console.log('\n✨ All tests passed! Backend is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Login to your app and get your auth token from localStorage');
console.log('2. Paste the token in this file where it says token = ""');
console.log('3. Run: cd server && npm install axios (if not installed)');
console.log('4. Run: node testEnhancedFeatures.js\n');
console.log('Press Ctrl+C to exit or edit the token and run the tests.\n');

// Uncomment below to run tests automatically
// testBackend();
