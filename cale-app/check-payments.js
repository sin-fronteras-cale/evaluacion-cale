// Script para verificar el estado de los pagos en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayments() {
    try {
        console.log('🔍 Revisando pagos en la base de datos...\n');

        // Obtener todos los pagos
        const allPayments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`📊 Total de pagos encontrados: ${allPayments.length}\n`);

        if (allPayments.length === 0) {
            console.log('❌ No se encontraron pagos en la base de datos.');
            console.log('Esto puede indicar que:');
            console.log('1. Los webhooks de Wompi no se están enviando');
            console.log('2. Los webhooks no están llegando al endpoint');
            console.log('3. Hay un error en el procesamiento de webhooks\n');
            return;
        }

        console.log('📋 Últimos 10 pagos:');
        console.log('='.repeat(80));

        allPayments.forEach((payment, index) => {
            const amount = payment.amountInCents / 100;
            const date = new Date(payment.createdAt).toLocaleString('es-CO');
            
            console.log(`${index + 1}. ${payment.transactionId}`);
            console.log(`   📅 Fecha: ${date}`);
            console.log(`   📧 Email: ${payment.customerEmail || 'N/A'}`);
            console.log(`   👤 Usuario: ${payment.userName || 'N/A'}`);
            console.log(`   💰 Monto: $${amount.toLocaleString('es-CO')} ${payment.currency}`);
            console.log(`   📌 Estado: ${payment.status}`);
            console.log(`   🔗 Referencia: ${payment.reference}`);
            console.log(`   💳 Método: ${payment.paymentMethodType || 'N/A'}`);
            console.log('   ' + '-'.repeat(60));
        });

        // Contar pagos por estado
        console.log('\n📈 Resumen por estado:');
        const statusCounts = {};
        allPayments.forEach(payment => {
            statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
        });

        Object.entries(statusCounts).forEach(([status, count]) => {
            const emoji = status === 'APPROVED' ? '✅' : 
                         status === 'PENDING' ? '🟡' : 
                         status === 'DECLINED' ? '❌' : '❓';
            console.log(`   ${emoji} ${status}: ${count}`);
        });

        // Buscar pagos pendientes
        const pendingPayments = allPayments.filter(p => 
            ['PENDING', 'IN_PROCESS', 'pending', 'in_process'].includes(p.status)
        );

        if (pendingPayments.length > 0) {
            console.log('\n🟡 Pagos pendientes encontrados:');
            pendingPayments.forEach(payment => {
                const date = new Date(payment.createdAt).toLocaleString('es-CO');
                console.log(`   • ${payment.transactionId} - ${payment.customerEmail} - ${date}`);
            });
        } else {
            console.log('\n🟡 No se encontraron pagos pendientes en la base de datos.');
        }

        // Verificar pagos de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPayments = allPayments.filter(p => new Date(p.createdAt) >= today);
        
        console.log(`\n📅 Pagos de hoy: ${todayPayments.length}`);

    } catch (error) {
        console.error('❌ Error al revisar pagos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPayments();