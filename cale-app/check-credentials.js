const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkCredentials() {
    try {
        const email = 'admin@cale.com';
        const plainPassword = 'admin123';
        
        console.log('Verificando credenciales para:', email);
        console.log('Password a probar:', plainPassword);
        console.log('');
        
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
            console.log('❌ Usuario no encontrado en la base de datos');
            return;
        }
        
        console.log('✅ Usuario encontrado:');
        console.log('  ID:', user.id);
        console.log('  Nombre:', user.name);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Password (hash):', user.password);
        console.log('');
        
        if (!user.password) {
            console.log('❌ El usuario no tiene contraseña configurada');
            return;
        }
        
        // Test bcrypt
        if (user.password.startsWith('$2')) {
            console.log('Tipo de hash: bcrypt');
            const isValid = await bcrypt.compare(plainPassword, user.password);
            console.log('Resultado de bcrypt.compare:', isValid);
            
            if (isValid) {
                console.log('✅ La contraseña es correcta!');
            } else {
                console.log('❌ La contraseña es incorrecta');
                
                // Try with other common passwords
                const testPasswords = ['admin', 'password', '123456', 'Admin123'];
                console.log('\nProbando otras contraseñas comunes...');
                for (const pwd of testPasswords) {
                    const test = await bcrypt.compare(pwd, user.password);
                    if (test) {
                        console.log(`✅ La contraseña correcta es: "${pwd}"`);
                        break;
                    }
                }
            }
        } else {
            console.log('Tipo de hash: texto plano');
            const isValid = user.password === plainPassword;
            console.log('Coincide con texto plano:', isValid);
            
            if (isValid) {
                console.log('✅ La contraseña es correcta (texto plano)');
            } else {
                console.log('❌ La contraseña no coincide');
                console.log('  Esperada:', user.password);
                console.log('  Recibida:', plainPassword);
            }
        }
        
        // Also check the other admin
        console.log('\n\n--- Verificando segundo administrador ---');
        const admin2 = await prisma.user.findUnique({
            where: { email: 'carlospt@live.com' }
        });
        
        if (admin2) {
            console.log('Usuario:', admin2.email);
            console.log('Nombre:', admin2.name);
            console.log('Password hash:', admin2.password?.substring(0, 20) + '...');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCredentials();
