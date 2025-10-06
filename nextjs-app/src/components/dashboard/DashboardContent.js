import { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency, getCategoryDisplayName } from '@/lib/utils';

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

export default DashboardContent;