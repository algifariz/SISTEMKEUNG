import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import withAuth from '@/components/auth/withAuth';
import Header from '@/components/dashboard/Header';
import Navigation from '@/components/dashboard/Navigation';
import DashboardContent from '@/components/dashboard/DashboardContent';
import TransaksiContent from '@/components/dashboard/TransaksiContent';
import RiwayatContent from '@/components/dashboard/RiwayatContent';
import LaporanContent from '@/components/dashboard/LaporanContent';
import PengaturanContent from '@/components/dashboard/PengaturanContent';
import FloatingActionButton from '@/components/dashboard/FloatingActionButton';
import EditModal from '@/components/dashboard/EditModal';

const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const router = useRouter();

    const showNotification = (message, type) => {
        console.log(`Notification (${type}): ${message}`);
        // Replace with a more robust notification system if available
        alert(`${type.toUpperCase()}: ${message}`);
    };

    const loadDataFromServer = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            showNotification(`Error loading data: ${error.message}`, 'error');
        } else {
            setTransactions(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadDataFromServer();
    }, [loadDataFromServer]);

    const handleAddTransaction = async (newTransaction) => {
        const { error } = await supabase.from('transactions').insert([newTransaction]);
        if (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } else {
            await loadDataFromServer();
            showNotification('Transaksi berhasil ditambahkan! 🎉', 'success');
            setActiveTab('dashboard');
        }
    };

    const handleUpdateTransaction = async (id, updatedTransaction) => {
        const { error } = await supabase.from('transactions').update(updatedTransaction).match({ id });
        if (error) {
            showNotification(`Gagal memperbarui: ${error.message}`, 'error');
        } else {
            await loadDataFromServer();
            showNotification('Transaksi berhasil diperbarui! ✨', 'success');
            closeEditModal();
        }
    };

    const handleDeleteTransaction = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
        const { error } = await supabase.from('transactions').delete().match({ id });
        if (error) {
            showNotification(`Gagal menghapus: ${error.message}`, 'error');
        } else {
            await loadDataFromServer();
            showNotification('Transaksi berhasil dihapus! 🗑️', 'success');
        }
    };

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await supabase.auth.signOut();
            router.push('/');
        }
    };

    const openEditModal = (transaction) => {
        setTransactionToEdit(transaction);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setTransactionToEdit(null);
        setEditModalOpen(false);
    };


    return (
        <>
            <Head>
                <title>MoneyTracker - Dashboard</title>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#4f46e5" />
                <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
                <Header transactions={transactions} />
                <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {loading ? (
                        <div className="text-center p-12">Loading data...</div>
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <DashboardContent transactions={transactions} setActiveTab={setActiveTab} />}
                            {activeTab === 'transaksi' && <TransaksiContent onAddTransaction={handleAddTransaction} />}
                            {activeTab === 'riwayat' && <RiwayatContent transactions={transactions} onEdit={openEditModal} onDelete={handleDeleteTransaction} />}
                            {activeTab === 'laporan' && <LaporanContent transactions={transactions} />}
                            {activeTab === 'pengaturan' && <PengaturanContent onLogout={handleLogout} />}
                        </>
                    )}
                </main>

                <FloatingActionButton setActiveTab={setActiveTab} />
                {isEditModalOpen && <EditModal transaction={transactionToEdit} onSave={handleUpdateTransaction} onClose={closeEditModal} />}
                <div id="notification-container" className="fixed top-4 right-4 z-50 space-y-2"></div>
            </div>
        </>
    );
};

export default withAuth(DashboardPage);