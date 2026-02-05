
const testExpiration = () => {
    const now = new Date();

    const users = [
        { name: 'Active User', isPro: true, proExpiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString() }, // 10 days left
        { name: 'Expired User', isPro: true, proExpiresAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString() }, // Expired yesterday
        { name: 'Normal User', isPro: false, proExpiresAt: null }
    ];

    console.log('--- Testing Expiration Logic ---');

    const results = users.map(user => {
        let status = user.isPro;
        let note = '';

        if (user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) < now) {
            status = false;
            note = '(Automatically reverted to Normal)';
        }

        return {
            name: user.name,
            originalPro: user.isPro,
            newPro: status,
            expiresAt: user.proExpiresAt,
            note
        };
    });

    console.table(results);
};

testExpiration();
