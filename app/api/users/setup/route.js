import { auth, createUserWithEmailAndPassword, googleProvider, signInWithPopup } from '@/lib/firebase';

export async function POST(req) {
    try {
        const { email, password, isGoogle = false } = await req.json();
        if (!email || (!isGoogle && !password)) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
        }

        // Validate password
        if (!isGoogle) {
            const requirements = {
                minLength: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                specialChar: /[!@#$%^&*]/.test(password),
            };
            if (!Object.values(requirements).every(Boolean)) {
                return new Response(JSON.stringify({ error: 'Password must meet all requirements' }), { status: 400 });
            }
        }

        let userCredential;
        if (isGoogle) {
            userCredential = await signInWithPopup(auth, googleProvider);
        } else {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        }

        return new Response(JSON.stringify({ message: 'Signup successful', uid: userCredential.user.uid }), { status: 201 });
    } catch (error) {
        console.error('Signup error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
}
