'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Placeholder for notification system
    const showNotification = (message: string, type: string) => {
        console.log(`Notification (${type}): ${message}`);
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else {
            alert(`Success: ${message}`);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            showNotification(error.message, 'error');
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
             showNotification('Registrasi gagal: Pengguna dengan email ini sudah ada.', 'error');
        } else {
            showNotification('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.', 'success');
            router.push('/login'); // Redirect to login page after successful registration
        }
        setLoading(false);
    };

    return (
        <>
            <Head>
                <title>Register - MoneyTracker</title>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#4f46e5" />
                <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 m-4">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-indigo-600">
                            <i className="fas fa-coins mr-2 text-yellow-400"></i>
                            Create Account
                        </h1>
                        <p className="text-lg text-gray-600">Join MoneyTracker today!</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <i className="fas fa-envelope"></i>
                                </span>
                                <input
                                    type="email"
                                    id="username"
                                    className="input-elegant w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    type="password"
                                    id="password"
                                    className="input-elegant w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full btn-elegant text-white py-3 px-6 rounded-xl font-semibold text-lg" disabled={loading}>
                            {loading ? 'Registering...' : (
                                <>
                                    <i className="fas fa-user-plus mr-2"></i>Register
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>

                <div id="notification-container" className="fixed top-4 right-4 z-50 space-y-2"></div>
            </div>
        </>
    );
}