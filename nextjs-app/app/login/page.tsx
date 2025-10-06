'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            if (signInError.message.toLowerCase().includes('failed to fetch')) {
                 setError('Gagal terhubung ke server. Periksa koneksi internet Anda. Jika Anda adalah developer, pastikan variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah benar di Vercel.');
            } else if (signInError.message.toLowerCase().includes('invalid login credentials')) {
                setError('Email atau password yang Anda masukkan salah.');
            } else {
                setError(`Terjadi kesalahan: ${signInError.message}`);
            }
        } else {
            router.push('/dashboard');
        }
        setLoading(false);
    };

    return (
        <>
            <Head>
                <title>Login - MoneyTracker</title>
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
                            MoneyTracker
                        </h1>
                        <p className="text-lg text-gray-600">Selamat datang kembali!</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <strong className="font-bold">Oops!</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
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
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full btn-elegant text-white py-3 px-6 rounded-xl font-semibold text-lg" disabled={loading}>
                            {loading ? 'Logging in...' : (
                                <>
                                    <i className="fas fa-sign-in-alt mr-2"></i>Login
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-gray-600">
                            Belum punya akun?{' '}
                            <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
                                Daftar di sini
                            </Link>
                        </p>
                    </div>
                </div>

                {/* This notification container can be replaced with a proper toast library */}
                <div id="notification-container" className="fixed top-4 right-4 z-50 space-y-2"></div>
            </div>
        </>
    );
}