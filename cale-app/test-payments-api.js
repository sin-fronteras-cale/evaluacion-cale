// Script para probar la API de pagos
const fetch = require('node-fetch');
const https = require('https');

// Permitir certificados auto-firmados para localhost
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testPaymentsAPI() {
    try {
        console.log('🔍 Probando la API de pagos...\n');

        const url = 'https://evaluacion-cale.vercel.app/api/payments';
        console.log(`📡 Llamando a: ${url}\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Payment-Test-Script'
            },
            agent: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? agent : undefined
        });

        console.log(`📊 Status de respuesta: ${response.status}`);
        console.log(`📊 Headers: ${JSON.stringify([...response.headers.entries()], null, 2)}\n`);

        if (!response.ok) {
            console.log(`❌ Error en la API: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`❌ Error body: ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log(`✅ API respuesta exitosa!\n`);

        if (!data.payments) {
            console.log('❌ No se encontró la propiedad "payments" en la respuesta');
            console.log('🔍 Estructura de respuesta:', JSON.stringify(data, null, 2));
            return;
        }

        const payments = data.payments;
        console.log(`📊 Total de pagos devueltos por la API: ${payments.length}\n`);

        if (payments.length === 0) {
            console.log('🟡 La API no devuelve ningún pago.');
            return;
        }

        console.log('📋 Pagos devueltos por la API:');
        console.log('='.repeat(80));

        payments.forEach((payment, index) => {
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
            console.log(`   🆔 ID: ${payment.id}`);
            console.log('   ' + '-'.repeat(60));
        });

        // Verificar pagos pendientes
        const pendingPayments = payments.filter(p => 
            ['PENDING', 'IN_PROCESS', 'pending', 'in_process'].includes(p.status)
        );

        console.log(`\n🟡 Pagos pendientes en la API: ${pendingPayments.length}`);
        if (pendingPayments.length > 0) {
            pendingPayments.forEach(payment => {
                const date = new Date(payment.createdAt).toLocaleString('es-CO');
                console.log(`   • ${payment.transactionId} - ${payment.customerEmail || payment.userName} - ${date} - ${payment.status}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al probar la API de pagos:', error.message);
        console.error('❌ Stack:', error.stack);
    }
}

testPaymentsAPI();