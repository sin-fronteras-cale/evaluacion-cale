const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        console.log('Buscando usuarios administradores...\n');
        
        const admins = await prisma.user.findMany({
            where: { role: 'admin' }
        });
        
        console.log(`Total de administradores: ${admins.length}\n`);
        
        if (admins.length > 0) {
            console.log('Administradores encontrados:');
            for (const admin of admins) {
                console.log(`- Email: ${admin.email}`);
                console.log(`  Nombre: ${admin.name}`);
                console.log(`  Password hash: ${admin.password ? 'Sí (hasheado)' : 'No'}`);
                console.log(`  Password tipo: ${admin.password?.startsWith('$2') ? 'bcrypt' : 'texto plano'}`);
                console.log('');
            }
        } else {
            console.log('⚠️  No hay usuarios administradores en la base de datos');
            console.log('\nCreando usuario administrador de prueba...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = await prisma.user.create({
                data: {
                    name: 'Administrador',
                    email: 'admin@cale.com',
                    password: hashedPassword,
                    role: 'admin',
                    isPro: true
                }
            });
            
            console.log('\n✅ Usuario administrador creado:');
            console.log(`   Email: ${newAdmin.email}`);
            console.log(`   Password: admin123`);
        }
        
        // Check users count
        const totalUsers = await prisma.user.count();
        console.log(`\n📊 Total de usuarios en el sistema: ${totalUsers}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
