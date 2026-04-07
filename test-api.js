const http = require('http');

// Simple test to check if server is running and API works
const testAPI = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
};

// Test the API endpoints
async function runTests() {
    try {
        console.log('Testing API endpoints...\n');

        // Test users endpoint (will fail without auth, but should get auth error)
        try {
            const users = await testAPI('/api/hod/users');
            console.log('Users API Response:', users);
        } catch (err) {
            console.log('Users API Error (expected without auth):', err.message);
        }

        // Test mentors endpoint
        try {
            const mentors = await testAPI('/api/hod/mentors');
            console.log('Mentors API Response:', mentors);
        } catch (err) {
            console.log('Mentors API Error (expected without auth):', err.message);
        }

        console.log('\nAPI tests completed. Note: Auth errors are expected without login.');

    } catch (err) {
        console.error('Test failed:', err);
    }
}

runTests();