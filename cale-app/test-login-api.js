// Test del login API
const testLogin = async () => {
    try {
        const url = 'http://localhost:3000/api/auth/login';
        const credentials = {
            email: 'admin@cale.com',
            password: 'admin123'
        };
        
        console.log('Testing login API...');
        console.log('URL:', url);
        console.log('Credentials:', credentials);
        console.log('');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('');
        
        const data = await response.json();
        console.log('Response body:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('\n✅ Login successful!');
            console.log('User:', data.user);
            
            // Check for auth cookie
            const cookies = response.headers.get('set-cookie');
            if (cookies) {
                console.log('\n🍪 Cookies set:', cookies);
            } else {
                console.log('\n⚠️  No cookies set in response');
            }
        } else {
            console.log('\n❌ Login failed:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testLogin();
