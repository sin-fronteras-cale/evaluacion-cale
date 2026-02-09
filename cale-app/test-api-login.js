#!/usr/bin/env node

console.log('=== PROBANDO LOGIN VÍA API ===');

const testCredentials = [
    { email: 'carlospt@live.com', password: 'admin123' },
    { email: 'carlospt@live.com', password: '123456' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'admin@cale.com', password: 'admin123' }
];

async function testAPILogin() {
    for (let creds of testCredentials) {
        try {
            console.log(`\n🧪 Probando: ${creds.email} / ${creds.password}`);
            
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: creds.email,
                    password: creds.password
                })
            });
            
            const data = await response.json();
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
            
            if (response.ok) {
                console.log(`   ✅ LOGIN EXITOSO - USA ESTA CREDENCIAL:`);
                console.log(`      📧 ${creds.email}`);
                console.log(`      🔑 ${creds.password}`);
                console.log(`      👤 ${data.user?.role || 'unknown'}`);
                break;
            } else {
                console.log(`   ❌ Login falló: ${data.error || 'Error desconocido'}`);
            }
            
        } catch (error) {
            console.log(`   💥 Error de conexión: ${error.message}`);
        }
    }
}

testAPILogin().catch(console.error);