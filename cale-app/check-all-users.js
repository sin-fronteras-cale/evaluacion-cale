const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function listUsersAndPasswords() {
    console.log('👥 USUARIOS Y CONTRASEÑAS ACTUALES\n');
    
    try {
        const users = await prisma.user.findMany({
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                password: true 
            },
            orderBy: { role: 'desc' }
        });

        console.log(`📊 Total: ${users.length} usuarios encontrados\n`);

        for (let user of users) {
            console.log(`${user.role === 'admin' ? '👑' : '👤'} ${user.role.toUpperCase()}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Nombre: ${user.name}`);
            console.log(`   🔑 Password Hash: ${user.password.substring(0, 20)}...`);
            
            // Probar contraseñas comunes
            const commonPasswords = ['123456', 'admin123', 'password', 'admin', user.name.toLowerCase()];
            let foundPassword = null;
            
            for (let testPass of commonPasswords) {
                try {
                    if (await bcrypt.compare(testPass, user.password)) {
                        foundPassword = testPass;
                        break;
                    }
                } catch (e) {
                    // Ignore bcrypt errors
                }
            }
            
            if (foundPassword) {
                console.log(`   ✅ Contraseña encontrada: "${foundPassword}"`);
            } else {
                console.log(`   ❓ Contraseña desconocida`);
            }
            console.log('');
        }

        console.log('🔧 CREDENCIALES CONOCIDAS QUE FUNCIONAN:');
        console.log('   📧 test@test.com');
        console.log('   🔑 test123');
        console.log('   👑 ROL: admin');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsersAndPasswords();