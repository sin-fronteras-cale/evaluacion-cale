const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleCredentials() {
    console.log('🔧 CREANDO CREDENCIALES SÚPER SIMPLES\n');
    
    try {
        // Contraseña súper simple: "123"
        const superSimple = await bcrypt.hash('123', 10);
        
        // Actualizar solo carlospt@live.com con contraseña "123"
        await prisma.user.update({
            where: { email: 'carlospt@live.com' },
            data: { password: superSimple }
        });
        
        // Verificar que funciona
        const user = await prisma.user.findUnique({
            where: { email: 'carlospt@live.com' }
        });
        
        const works = await bcrypt.compare('123', user.password);
        
        console.log('✅ CONTRASEÑA ACTUALIZADA:');
        console.log(`📧 Email: carlospt@live.com`);
        console.log(`🔑 Contraseña: 123`);
        console.log(`👑 Rol: ${user.role}`);
        console.log(`✅ Verificación: ${works ? 'FUNCIONA' : 'FALLA'}`);
        
        console.log('\n📋 TODAS LAS CREDENCIALES FUNCIONALES:');
        console.log('1. carlospt@live.com / 123');
        console.log('2. test@test.com / test123');
        console.log('3. admin@cale.com / admin123');
        
        console.log('\n🌐 INSTRUCCIONES:');
        console.log('1. Ve a: http://localhost:3000');
        console.log('2. Haz clic en "Iniciar Sesión"');  
        console.log('3. Usa: carlospt@live.com / 123');
        console.log('4. Si falla, abre DevTools (F12) → Console');
        console.log('5. Busca errores en rojo');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSimpleCredentials();