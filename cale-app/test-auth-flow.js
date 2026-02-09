// Test de autenticación completo
const testAuth = async () => {
    try {
        console.log('🧪 Test de flujo completo de autenticación\n');
        
        // 1. Login
        console.log('1️⃣ PASO 1: Login');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test123'
            })
        });
        
        console.log('   Status:', loginRes.status);
        const loginData = await loginRes.json();
        console.log('   Response:', loginData);
        
        const cookies = loginRes.headers.get('set-cookie');
        console.log('   Cookies:', cookies ? 'Sí' : 'No');
        
        if (!loginRes.ok) {
            console.log('\n❌ Login falló');
            return;
        }
        
        // Extract token from cookies
        let token = null;
        if (cookies) {
            const match = cookies.match(/auth_token=([^;]+)/);
            if (match) {
                token = match[1];
                console.log('   Token extraído:', token.substring(0, 20) + '...');
            }
        }
        
        if (!token) {
            console.log('\n❌ No se pudo extraer el token');
            return;
        }
        
        // 2. Test /api/auth/me
        console.log('\n2️⃣ PASO 2: Verificar sesión (/api/auth/me)');
        const meRes = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Cookie': `auth_token=${token}`
            }
        });
        
        console.log('   Status:', meRes.status);
        const meData = await meRes.json();
        console.log('   User:', meData.user);
        
        if (!meData.user) {
            console.log('\n❌ No se pudo obtener el usuario actual');
            return;
        }
        
        // 3. Test /api/users (admin endpoint)
        console.log('\n3️⃣ PASO 3: Acceder a /api/users (requiere admin)');
        const usersRes = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Cookie': `auth_token=${token}`
            }
        });
        
        console.log('   Status:', usersRes.status);
        
        if (usersRes.ok) {
            const usersData = await usersRes.json();
            console.log('   Usuarios encontrados:', usersData.users?.length || 0);
            console.log('\n✅ Todo funcionó correctamente!');
        } else {
            const errorData = await usersRes.json();
            console.log('   Error:', errorData);
            console.log('\n❌ Fallo al acceder a /api/users');
            
            if (usersRes.status === 401) {
                console.log('\n💡 Problema: No autenticado');
                console.log('   - El token no está siendo leído correctamente');
                console.log('   - O el token es inválido');
            } else if (usersRes.status === 403) {
                console.log('\n💡 Problema: No autorizado');
                console.log('   - El usuario no tiene role="admin"');
                console.log('   - Role actual:', meData.user?.role);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testAuth();
