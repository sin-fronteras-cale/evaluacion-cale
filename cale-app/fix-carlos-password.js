console.log('🔧 Iniciando reset de contraseñas...');
console.log('Cargando Prisma...');

const { PrismaClient } = require('@prisma/client');
console.log('Prisma cargado');

const bcrypt = require('bcryptjs');
console.log('bcrypt cargado');

const prisma = new PrismaClient();
console.log('Cliente de Prisma creado');

async function main() {
    console.log('📋 Listando usuarios actuales:');
    
    try {
        const users = await prisma.user.findMany();
        console.log(`Encontrados ${users.length} usuarios`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.role})`);
        });

        // Reset específico para carlospt@live.com
        console.log('\n🔄 Actualizando carlospt@live.com...');
        const newHash = await bcrypt.hash('admin123', 10);
        
        await prisma.user.update({
            where: { email: 'carlospt@live.com' },
            data: { password: newHash }
        });
        
        console.log('✅ carlospt@live.com actualizado');
        console.log('🔑 Nueva contraseña: admin123');
        
    } catch (error) {
        console.error('❌ Error completo:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🔌 Conexión cerrada');
    }
}

main().catch(console.error);