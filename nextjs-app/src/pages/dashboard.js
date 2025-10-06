import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import withAuth from '@/components/auth/withAuth';
import Chart from 'chart.js/auto';

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
};

const getCategoryDisplayName = (key) => {
    const names = { 'makanan': '🍽️ Makanan', 'transportasi': '🚗 Transportasi', 'belanja': '🛒 Belanja', 'tagihan': '📄 Tagihan', 'kesehatan': '🏥 Kesehatan', 'pendidikan': '📚 Pendidikan', 'hiburan': '🎬 Hiburan', 'gaji': '💼 Gaji', 'bonus': '🎁 Bonus', 'lainnya': '📝 Lainnya' };
    return names[key] || key;
};

// --- MAIN DASHBOARD PAGE ---
const DashboardPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const router = useRouter();

    const showNotification = (message, type) => {
        console.log(`Notification (${type}): ${message}`);
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

// --- SUB-COMPONENTS ---

const Header = ({ transactions }) => {
    const balance = transactions.reduce((acc, t) => acc + (t.type === 'pemasukan' ? t.amount : -t.amount), 0);
    return (
        <header className="hero-bg text-white relative">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="animate-slide-up text-center sm:text-left mb-6 sm:mb-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 relative z-10">
                            <i className="fas fa-coins mr-2 sm:mr-4 text-yellow-300"></i>
                            MoneyTracker
                        </h1>
                        <p className="text-lg sm:text-xl text-indigo-100 relative z-10">Kelola keuangan dengan elegan</p>
                    </div>
                    <div className="hidden md:block animate-fade-in">
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
                                <div className="text-sm text-indigo-200">Saldo Saat Ini</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-20 h-20 bg-white opacity-5 rounded-full"></div>
        </header>
    );
};

const Navigation = ({ activeTab, setActiveTab }) => {
    const tabs = ['dashboard', 'transaksi', 'riwayat', 'laporan', 'pengaturan'];
    const icons = ['fa-chart-pie', 'fa-plus-circle', 'fa-history', 'fa-chart-bar', 'fa-cog'];

    return (
         <nav className="sidebar-blur sticky top-0 z-40 border-b border-white/20">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex space-x-2 overflow-x-auto py-3 sm:py-4">
                    {tabs.map((tab, i) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-elegant px-4 py-2 sm:px-6 sm:py-3 font-medium transition-all duration-300 flex-1 sm:flex-none flex items-center justify-center ${activeTab === tab ? 'active text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                        >
                            <i className={`fas ${icons[i]} sm:mr-2`}></i>
                            <span className="hidden sm:inline capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

const DashboardContent = ({ transactions, setActiveTab }) => {
    const incomeExpenseCanvas = useRef(null);
    const categoryCanvas = useRef(null);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const calculateTotals = (filteredTransactions) => {
        return filteredTransactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'pemasukan') acc.income += amount;
            else acc.expense += amount;
            return acc;
        }, { income: 0, expense: 0 });
    };

    const overallTotals = calculateTotals(transactions);
    const currentBalance = overallTotals.income - overallTotals.expense;

    const currentMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyTotals = calculateTotals(currentMonthTransactions);

    useEffect(() => {
        const last6Months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            last6Months.push(date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));

            const monthIncome = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && t.type === 'pemasukan';
            }).reduce((sum, t) => sum + t.amount, 0);

            const monthExpense = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && t.type === 'pengeluaran';
            }).reduce((sum, t) => sum + t.amount, 0);

            incomeData.push(monthIncome);
            expenseData.push(monthExpense);
        }

        const categoryData = transactions
            .filter(t => t.type === 'pengeluaran')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const incomeExpenseChart = new Chart(incomeExpenseCanvas.current, {
            type: 'line',
            data: { labels: last6Months, datasets: [
                { label: 'Pemasukan', data: incomeData, borderColor: '#4facfe', backgroundColor: 'rgba(79, 172, 254, 0.1)', tension: 0.4, fill: true },
                { label: 'Pengeluaran', data: expenseData, borderColor: '#f5576c', backgroundColor: 'rgba(245, 87, 108, 0.1)', tension: 0.4, fill: true }
            ]},
            options: { responsive: true, maintainAspectRatio: false }
        });
        const categoryChart = new Chart(categoryCanvas.current, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData).map(getCategoryDisplayName),
                datasets: [{ data: Object.values(categoryData), backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
        });
        return () => {
            incomeExpenseChart.destroy();
            categoryChart.destroy();
        };
    }, [transactions]);

    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);


    return (
        <div className="animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="stats-card rounded-2xl p-4 sm:p-6">
                    <p className="text-gray-600 text-sm font-medium">Saldo Saat Ini</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(currentBalance)}</p>
                </div>
                <div className="stats-card rounded-2xl p-4 sm:p-6">
                    <p className="text-gray-600 text-sm font-medium">Pemasukan Bulan Ini</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(monthlyTotals.income)}</p>
                </div>
                <div className="stats-card rounded-2xl p-4 sm:p-6">
                    <p className="text-gray-600 text-sm font-medium">Pengeluaran Bulan Ini</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{formatCurrency(monthlyTotals.expense)}</p>
                </div>
                <div className="stats-card rounded-2xl p-4 sm:p-6">
                    <p className="text-gray-600 text-sm font-medium">Total Transaksi</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{transactions.length}</p>
                </div>
            </div>
            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 card-elegant rounded-2xl p-6 animate-slide-up">
                    <h3 className="text-xl font-semibold text-gray-800">Tren Keuangan</h3>
                    <div className="relative h-64 md:h-80"><canvas ref={incomeExpenseCanvas}></canvas></div>
                </div>
                <div className="card-elegant rounded-2xl p-6 animate-slide-up">
                    <h3 className="text-xl font-semibold text-gray-800">Kategori Pengeluaran</h3>
                    <div className="relative h-64 md:h-80"><canvas ref={categoryCanvas}></canvas></div>
                </div>
            </div>
            {/* Quick Actions & Recent Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="card-elegant rounded-2xl p-6 animate-slide-up">
                    <h4 className="font-semibold text-gray-800 mb-4">Transaksi Terakhir</h4>
                    <div className="space-y-3">
                         {recent.length > 0 ? recent.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-full mr-3 ${t.type === 'pemasukan' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <i className={`fas ${t.type === 'pemasukan' ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'}`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{getCategoryDisplayName(t.category)}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        )) : <p className="text-gray-500 text-sm">Belum ada transaksi</p>}
                    </div>
                </div>
                 <div className="card-elegant rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <h4 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h4>
                    <div className="space-y-3">
                        <button onClick={() => setActiveTab('transaksi')} className="w-full btn-elegant text-white py-3 px-4 rounded-xl font-medium">
                            <i className="fas fa-plus mr-2"></i>Tambah Transaksi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TransaksiContent = ({ onAddTransaction }) => {
    const [type, setType] = useState('pemasukan');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("You must be logged in to add a transaction.");
            return;
        }
        const formData = new FormData(e.target);
        const newTransaction = {
            user_id: user.id,
            type: type,
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            description: formData.get('description')
        };
        await onAddTransaction(newTransaction);
        e.target.reset();
        setType('pemasukan');
    };

    return (
         <div className="max-w-2xl mx-auto">
            <div className="card-elegant rounded-2xl p-8 animate-scale-in">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Tambah Transaksi</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex bg-gray-100 rounded-2xl p-1">
                        <button type="button" onClick={() => setType('pemasukan')} className={`flex-1 py-3 px-6 rounded-xl font-medium ${type === 'pemasukan' ? 'gradient-success text-white' : 'text-gray-600'}`}>Pemasukan</button>
                        <button type="button" onClick={() => setType('pengeluaran')} className={`flex-1 py-3 px-6 rounded-xl font-medium ${type === 'pengeluaran' ? 'gradient-secondary text-white' : 'text-gray-600'}`}>Pengeluaran</button>
                    </div>
                    <input name="amount" type="number" placeholder="Jumlah" required className="input-elegant w-full p-4 rounded-xl"/>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="input-elegant w-full p-4 rounded-xl"/>
                    <select name="category" required className="input-elegant w-full p-4 rounded-xl">
                        <option value="makanan">🍽️ Makanan & Minuman</option>
                        <option value="transportasi">🚗 Transportasi</option>
                        <option value="belanja">🛒 Belanja</option>
                        <option value="tagihan">📄 Tagihan</option>
                        <option value="kesehatan">🏥 Kesehatan</option>
                        <option value="pendidikan">📚 Pendidikan</option>
                        <option value="hiburan">🎬 Hiburan</option>
                        <option value="gaji">💼 Gaji</option>
                        <option value="bonus">🎁 Bonus</option>
                        <option value="lainnya">📝 Lainnya</option>
                    </select>
                    <textarea name="description" placeholder="Keterangan" className="input-elegant w-full p-4 rounded-xl"></textarea>
                    <button type="submit" className="w-full btn-elegant text-white py-4 text-lg rounded-xl">Tambah</button>
                </form>
            </div>
        </div>
    );
};

const RiwayatContent = ({ transactions, onEdit, onDelete }) => {
    return (
        <div className="card-elegant rounded-2xl overflow-hidden animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 p-6">Riwayat Transaksi</h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                     <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Jenis</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Jumlah</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Keterangan</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4"><span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type}</span></td>
                                <td className="px-6 py-4">{getCategoryDisplayName(t.category)}</td>
                                <td className={`px-6 py-4 font-semibold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={t.description}>{t.description || '-'}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => onEdit(t)} className="text-indigo-600 hover:text-indigo-900 mr-4"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => onDelete(t.id)} className="text-red-600 hover:text-red-900"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LaporanContent = ({ transactions }) => {
    return <div className="card-elegant p-6 animate-fade-in"><h2 className="text-2xl font-bold text-gray-800">Laporan</h2><p className="text-gray-600 mt-2">Fitur laporan sedang dalam pengembangan.</p></div>;
};

const PengaturanContent = ({ onLogout }) => (
    <div className="card-elegant p-6 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan</h2>
        <button onClick={onLogout} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-colors">
            <i className="fas fa-sign-out-alt mr-2"></i>Logout
        </button>
    </div>
);

const FloatingActionButton = ({ setActiveTab }) => (
    <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setActiveTab('transaksi')} className="btn-elegant text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <i className="fas fa-plus text-2xl"></i>
        </button>
    </div>
);

const EditModal = ({ transaction, onSave, onClose }) => {
    const [formData, setFormData] = useState(transaction);

    useEffect(() => {
        setFormData(transaction);
    }, [transaction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { id, user_id, ...updateData } = formData;
        onSave(id, { ...updateData, amount: parseFloat(updateData.amount) });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card-elegant rounded-2xl max-w-md w-full p-6 animate-scale-in">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Transaksi</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={formData.id} />
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl">
                            <option value="pemasukan">Pemasukan</option>
                            <option value="pengeluaran">Pengeluaran</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl">
                            <option value="makanan">🍽️ Makanan & Minuman</option>
                            <option value="transportasi">🚗 Transportasi</option>
                            <option value="belanja">🛒 Belanja</option>
                            <option value="tagihan">📄 Tagihan</option>
                            <option value="kesehatan">🏥 Kesehatan</option>
                            <option value="pendidikan">📚 Pendidikan</option>
                            <option value="hiburan">🎬 Hiburan</option>
                            <option value="gaji">💼 Gaji</option>
                            <option value="bonus">🎁 Bonus</option>
                            <option value="lainnya">📝 Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl"></textarea>
                    </div>
                    <div className="flex space-x-4 pt-4">
                        <button type="submit" className="flex-1 gradient-primary text-white py-3 rounded-xl">Simpan</button>
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-500 text-white py-3 rounded-xl">Batal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default withAuth(DashboardPage);