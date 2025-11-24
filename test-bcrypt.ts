import bcrypt from 'bcryptjs';

async function main() {
    try {
        console.log('Testing bcrypt...');
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);
        console.log('Hash created:', hash);

        const valid = await bcrypt.compare(password, hash);
        console.log('Comparison result:', valid);

        if (valid) {
            console.log('Bcrypt is working correctly.');
        } else {
            console.error('Bcrypt failed verification.');
        }
    } catch (e) {
        console.error('Bcrypt error:', e);
    }
}

main();
