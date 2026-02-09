const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteFlow() {
    console.log('🧪 Test completo de conexión de bases de datos\n');
    
    try {
        // 1. Test usuarios
        console.log('1️⃣ USUARIOS');
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });
        console.log(`   ✅ ${users.length} usuarios encontrados`);
        console.log(`   📧 Emails: ${users.map(u => u.email).join(', ')}`);
        
        // 2. Test preguntas
        console.log('\n2️⃣ PREGUNTAS');
        const questions = await prisma.question.findMany();
        console.log(`   ✅ ${questions.length} preguntas encontradas`);
        
        // Contar por categoría
        const byCategory = questions.reduce((acc, q) => {
            acc[q.category] = (acc[q.category] || 0) + 1;
            return acc;
        }, {});
        console.log(`   📊 Por categoría: ${JSON.stringify(byCategory)}`);
        
        // 3. Test resultados
        console.log('\n3️⃣ RESULTADOS');
        const results = await prisma.result.findMany({
            select: { id: true, userId: true, category: true, score: true, totalQuestions: true }
        });
        console.log(`   ✅ ${results.length} resultados encontrados`);
        
        if (results.length > 0) {
            const avgScore = results.reduce((sum, r) => sum + (r.score / r.totalQuestions), 0) / results.length;
            console.log(`   📈 Promedio general: ${(avgScore * 100).toFixed(1)}%`);
        }
        
        // 4. Test pagos
        console.log('\n4️⃣ PAGOS');
        const payments = await prisma.payment.findMany({
            select: { id: true, userId: true, status: true, amountInCents: true }
        });
        console.log(`   ✅ ${payments.length} pagos encontrados`);
        
        if (payments.length > 0) {
            const totalAmount = payments.reduce((sum, p) => sum + p.amountInCents, 0) / 100;
            console.log(`   💰 Total procesado: $${totalAmount.toLocaleString()} COP`);
        }
        
        // 5. Test configuraciones
        console.log('\n5️⃣ CONFIGURACIONES');
        const settings = await prisma.appSetting.findMany();
        console.log(`   ✅ ${settings.length} configuraciones encontradas`);
        settings.forEach(s => {
            console.log(`   ⚙️  ${s.key}: ${s.valueText || s.valueInt || s.valueJson}`);
        });
        
        console.log('\n✅ TODAS LAS BASES DE DATOS ESTÁN FUNCIONANDO CORRECTAMENTE');
        
    } catch (error) {
        console.error('❌ Error en test completo:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteFlow();