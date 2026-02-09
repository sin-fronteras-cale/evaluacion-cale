const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
    try {
        console.log('Creando usuario de prueba...\n');
        
        const email = 'test@test.com';
        const password = 'test123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if exists
        const existing = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existing) {
            console.log('Usuario ya existe, actualizando...');
            const updated = await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'admin'
                }
            });
            console.log('✅ Usuario actualizado');
        } else {
            const newUser = await prisma.user.create({
                data: {
                    name: 'Usuario de Prueba',
                    email: email,
                    password: hashedPassword,
                    role: 'admin',
                    isPro: true
                }
            });
            console.log('✅ Usuario creado');
        }
        
        console.log('\nCredenciales de prueba:');
        console.log('  Email:', email);
        console.log('  Password:', password);
        console.log('\n⚠️  Usa estas credenciales para hacer login');
        
        // Verify it works
        console.log('\n--- Verificando credenciales ---');
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (user && user.password) {
            const isValid = await bcrypt.compare(password, user.password);
            console.log('Verificación bcrypt:', isValid ? '✅ Correcto' : '❌ Incorrecto');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
