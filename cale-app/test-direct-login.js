const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginCredentials() {
    console.log('🧪 PROBANDO CREDENCIALES DE LOGIN DIRECTAMENTE\n');
    
    const testCredentials = [
        { email: 'carlospt@live.com', password: 'admin123' },
        { email: 'test@test.com', password: 'test123' },
        { email: 'admin@cale.com', password: 'admin123' }
    ];
    
    try {
        for (let cred of testCredentials) {
            console.log(`🔍 Probando: ${cred.email} / ${cred.password}`);
            
            const user = await prisma.user.findUnique({
                where: { email: cred.email }
            });
            
            if (!user) {
                console.log(`   ❌ Usuario no encontrado`);
                continue;
            }
            
            console.log(`   ✅ Usuario encontrado: ${user.name} (${user.role})`);
            console.log(`   🔑 Hash en BD: ${user.password}`);
            
            try {
                const isValid = await bcrypt.compare(cred.password, user.password);
                console.log(`   🔐 bcrypt.compare result: ${isValid}`);
                
                if (isValid) {
                    console.log(`   ✅ CREDENCIAL VÁLIDA - USÁ ESTA:`);
                    console.log(`      Email: ${cred.email}`);
                    console.log(`      Password: ${cred.password}`);
                    console.log(`      Rol: ${user.role}`);
                } else {
                    console.log(`   ❌ Contraseña incorrecta`);
                }
            } catch (bcryptError) {
                console.log(`   💥 Error en bcrypt: ${bcryptError.message}`);
            }
            
            console.log('');
        }
        
        // Crear nueva contraseña simple para carlospt
        console.log('🔧 CREANDO NUEVA CONTRASEÑA SIMPLE...');
        const simplePassword = '123456';
        const newHash = await bcrypt.hash(simplePassword, 10);
        
        await prisma.user.update({
            where: { email: 'carlospt@live.com' },
            data: { password: newHash }
        });
        
        // Verificar inmediatamente
        const updatedUser = await prisma.user.findUnique({
            where: { email: 'carlospt@live.com' }
        });
        
        const testResult = await bcrypt.compare(simplePassword, updatedUser.password);
        
        console.log(`📧 Email: carlospt@live.com`);
        console.log(`🔑 Nueva contraseña: ${simplePassword}`);
        console.log(`✅ Verificación: ${testResult ? 'FUNCIONA' : 'FALLA'}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLoginCredentials();