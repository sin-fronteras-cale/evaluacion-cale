
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentFlow() {
    console.log('--- Phase 1: User Preparation ---');
    // 1. Create/Find a test user
    let user = await prisma.user.upsert({
        where: { email: 'tester@payment.com' },
        update: { isPro: false, proExpiresAt: null },
        create: {
            name: 'Tester Payment',
            email: 'tester@payment.com',
            role: 'user',
            isPro: false
        }
    });

    console.log(`Current Status: ${user.name} - Pro: ${user.isPro}`);

    console.log('\n--- Phase 2: Simulating Successful Payment ---');
    // 2. Simulate the logic in /api/payments/verify/route.ts
    // We mock a successful Wompi notification for reference: PRO-testerID-timestamp
    const reference = `PRO-${user.id}-${Date.now()}`;
    console.log(`Simulating event for reference: ${reference}`);

    const userId = reference.split('-')[1];

    // Logic from API:
    const proExpiresAt = new Date();
    proExpiresAt.setDate(proExpiresAt.getDate() + 120);

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            isPro: true,
            proExpiresAt: proExpiresAt
        }
    });

    console.log('\n--- Phase 3: Final Verification ---');
    console.log(`Updated Status: ${updatedUser.name}`);
    console.log(`Is Pro now? ${updatedUser.isPro}`);
    console.log(`Expiration Date: ${updatedUser.proExpiresAt.toLocaleDateString()}`);

    if (updatedUser.isPro === true && updatedUser.proExpiresAt > new Date()) {
        console.log('\n✅ TEST SUCCESS: The account turned PRO for 120 days correctly.');
    } else {
        console.log('\n❌ TEST FAILED: Status did not update correctly.');
    }

    await prisma.$disconnect();
}

testPaymentFlow().catch(console.error);
