const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPasswords() {
    console.log('🔧 RESETEANDO CONTRASEÑAS PARA TODOS LOS USUARIOS\n');
    
    try {
        // Password simple para todos: "123456"
        const newPassword = '123456';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });

        console.log(`📊 Actualizando ${users.length} usuarios...\n`);

        for (let user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            
            console.log(`${user.role === 'admin' ? '👑' : '👤'} ${user.email}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Nueva contraseña: ${newPassword}`);
            console.log(`   👤 Rol: ${user.role}`);
            console.log('');
        }

        console.log('✅ TODAS LAS CONTRASEÑAS ACTUALIZADAS');
        console.log(`🔑 Nueva contraseña universal: "${newPassword}"`);
        console.log('\n🚀 USUARIOS ADMIN PARA PRUEBAS:');
        
        const admins = users.filter(u => u.role === 'admin');
        admins.forEach(admin => {
            console.log(`   👑 ${admin.email} / ${newPassword}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetUserPasswords();