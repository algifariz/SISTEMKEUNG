// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentChart = null;
let reportChart = null;
let categoryChart = null;

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwu-RrNXbpHAYfhh8KPxvz55svJhDxYZDNJAJChxQxzR9ixiOJkqt1cGD0qzM2tXHJdlA/exec';
let isOnline = navigator.onLine;
let pendingSyncs = JSON.parse(localStorage.getItem('pendingSyncs')) || [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    document.getElementById('report-start-date').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today;
    
    // Set default transaction type
    setTransactionType('pemasukan');
    
    // Load data from cloud first, then local
    loadDataFromCloud().then(() => {
        updateDashboard();
        updateTransactionsTable();
        updateRecentTransactions();
    });
    
    // Event listeners
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('edit-form').addEventListener('submit', updateTransaction);
    document.getElementById('search-transactions').addEventListener('input', filterTransactions);
    document.getElementById('filter-type').addEventListener('change', filterTransactions);
    
    // Online/offline status
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus();
        syncPendingData();
        showNotification('Kembali online! Menyinkronkan data... 🌐', 'success');
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus();
        showNotification('Mode offline. Data akan disinkronkan saat online 📱', 'info');
    });
    
    // Update connection status initially
    updateConnectionStatus();
    
    // Auto sync every 5 minutes when online
    setInterval(() => {
        if (isOnline) {
            syncPendingData();
        }
    }, 300000);
});

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-elegant').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-600');
        btn.classList.remove('text-indigo-600');
    });
    
    // Show selected tab content
    document.getElementById(tabName + '-content').classList.remove('hidden');
    
    // Add active class to selected tab
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('active');
    activeTab.classList.remove('text-gray-600');
    activeTab.classList.add('text-indigo-600');
    
    // Update dashboard when switching to dashboard tab
    if (tabName === 'dashboard') {
        setTimeout(updateDashboard, 100);
    }
}

// Transaction type toggle
function setTransactionType(type) {
    document.getElementById('transaction-type').value = type;
    
    const incomeBtn = document.getElementById('income-btn');
    const expenseBtn = document.getElementById('expense-btn');
    
    if (type === 'pemasukan') {
        incomeBtn.className = 'flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 gradient-success text-white';
        expenseBtn.className = 'flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 text-gray-600 hover:text-gray-800';
    } else {
        expenseBtn.className = 'flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 gradient-secondary text-white';
        incomeBtn.className = 'flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 text-gray-600 hover:text-gray-800';
    }
}

// Transaction management
function addTransaction(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: document.getElementById('transaction-type').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        category: document.getElementById('transaction-category').value,
        date: document.getElementById('transaction-date').value,
        description: document.getElementById('transaction-description').value,
        timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveTransactions();
    
    // Sync to cloud
    syncTransactionToCloud(transaction, 'add');
    
    // Reset form
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    setTransactionType('pemasukan');
    
    // Update displays
    updateDashboard();
    updateTransactionsTable();
    updateRecentTransactions();
    
    // Show success message
    showNotification('Transaksi berhasil ditambahkan! 🎉', 'success');
    
    // Switch to dashboard
    showTab('dashboard');
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-category').value = transaction.category;
    document.getElementById('edit-date').value = transaction.date;
    document.getElementById('edit-description').value = transaction.description;
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

function updateTransaction(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const transactionIndex = transactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) return;
    
    const updatedTransaction = {
        ...transactions[transactionIndex],
        type: document.getElementById('edit-type').value,
        amount: parseFloat(document.getElementById('edit-amount').value),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        description: document.getElementById('edit-description').value
    };
    
    transactions[transactionIndex] = updatedTransaction;
    saveTransactions();
    
    // Sync to cloud
    syncTransactionToCloud(updatedTransaction, 'update');
    
    updateDashboard();
    updateTransactionsTable();
    updateRecentTransactions();
    closeEditModal();
    
    showNotification('Transaksi berhasil diperbarui! ✨', 'success');
}

function deleteTransaction(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        const transaction = transactions.find(t => t.id === id);
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        
        // Sync to cloud
        if (transaction) {
            syncTransactionToCloud(transaction, 'delete');
        }
        
        updateDashboard();
        updateTransactionsTable();
        updateRecentTransactions();
        showNotification('Transaksi berhasil dihapus! 🗑️', 'success');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

// Data management
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function savePendingSyncs() {
    localStorage.setItem('pendingSyncs', JSON.stringify(pendingSyncs));
    updatePendingCount();
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = isOnline ? 'Terhubung' : 'Offline';
        statusElement.className = isOnline ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
    }
}

function updatePendingCount() {
    const countElement = document.getElementById('pending-count');
    if (countElement) {
        countElement.textContent = pendingSyncs.length;
        countElement.className = pendingSyncs.length > 0 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold';
    }
}

// Dashboard updates
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const amount = transaction.amount;
        
        if (transaction.type === 'pemasukan') {
            totalIncome += amount;
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthlyIncome += amount;
            }
        } else {
            totalExpense += amount;
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                monthlyExpense += amount;
            }
        }
    });
    
    const currentBalance = totalIncome - totalExpense;
    
    // Update dashboard cards
    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('hero-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthly-expense').textContent = formatCurrency(monthlyExpense);
    document.getElementById('total-transactions').textContent = transactions.length;
    
    // Update charts
    updateCharts();
}

function updateCharts() {
    // Income vs Expense Chart
    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const last6Months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        last6Months.push(date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));
        
        let monthIncome = 0;
        let monthExpense = 0;
        
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getMonth() === month && transactionDate.getFullYear() === year) {
                if (transaction.type === 'pemasukan') {
                    monthIncome += transaction.amount;
                } else {
                    monthExpense += transaction.amount;
                }
            }
        });
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
    }
    
    currentChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: last6Months,
            datasets: [{
                label: 'Pemasukan',
                data: incomeData,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#4facfe',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Pengeluaran',
                data: expenseData,
                borderColor: '#f5576c',
                backgroundColor: 'rgba(245, 87, 108, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointBackgroundColor: '#f5576c',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
    
    // Category Chart
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const categoryData = {};
    const categoryColors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140'
    ];
    
    transactions.forEach(transaction => {
        if (transaction.type === 'pengeluaran') {
            categoryData[transaction.category] = (categoryData[transaction.category] || 0) + transaction.amount;
        }
    });
    
    categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData).map(key => {
                const categoryNames = {
                    'makanan': 'Makanan',
                    'transportasi': 'Transportasi',
                    'belanja': 'Belanja',
                    'tagihan': 'Tagihan',
                    'kesehatan': 'Kesehatan',
                    'pendidikan': 'Pendidikan',
                    'hiburan': 'Hiburan',
                    'gaji': 'Gaji',
                    'bonus': 'Bonus',
                    'lainnya': 'Lainnya'
                };
                return categoryNames[key] || key;
            }),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: categoryColors,
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Recent transactions
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada transaksi</p>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => {
        const categoryNames = {
            'makanan': '🍽️ Makanan',
            'transportasi': '🚗 Transportasi',
            'belanja': '🛒 Belanja',
            'tagihan': '📄 Tagihan',
            'kesehatan': '🏥 Kesehatan',
            'pendidikan': '📚 Pendidikan',
            'hiburan': '🎬 Hiburan',
            'gaji': '💼 Gaji',
            'bonus': '🎁 Bonus',
            'lainnya': '📝 Lainnya'
        };
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div class="flex items-center">
                    <div class="w-2 h-2 rounded-full ${transaction.type === 'pemasukan' ? 'bg-green-500' : 'bg-red-500'} mr-3"></div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${categoryNames[transaction.category] || transaction.category}</p>
                        <p class="text-xs text-gray-500">${new Date(transaction.date).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
                <span class="text-sm font-semibold ${transaction.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}">
                    ${transaction.type === 'pemasukan' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </span>
            </div>
        `;
    }).join('');
}

// Transaction table
function updateTransactionsTable() {
    const tbody = document.getElementById('transactions-table');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4 block"></i>
                    <p class="text-lg font-medium">Belum ada transaksi</p>
                    <p class="text-sm">Mulai tambahkan transaksi pertama Anda</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.className = 'transaction-row animate-fade-in';
        row.style.animationDelay = `${index * 0.05}s`;
        
        const categoryNames = {
            'makanan': '🍽️ Makanan',
            'transportasi': '🚗 Transportasi',
            'belanja': '🛒 Belanja',
            'tagihan': '📄 Tagihan',
            'kesehatan': '🏥 Kesehatan',
            'pendidikan': '📚 Pendidikan',
            'hiburan': '🎬 Hiburan',
            'gaji': '💼 Gaji',
            'bonus': '🎁 Bonus',
            'lainnya': '📝 Lainnya'
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${new Date(transaction.date).toLocaleDateString('id-ID')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === 'pemasukan' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${transaction.type === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${categoryNames[transaction.category] || transaction.category}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${
                transaction.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'
            }">
                ${transaction.type === 'pemasukan' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                ${transaction.description || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTransaction(${transaction.id})" class="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTransaction(${transaction.id})" class="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filter transactions
function filterTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                            transaction.category.toLowerCase().includes(searchTerm);
        const matchesType = !filterType || transaction.type === filterType;
        
        return matchesSearch && matchesType;
    });
    
    // Update table with filtered results
    const tbody = document.getElementById('transactions-table');
    tbody.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-search text-4xl mb-4 block"></i>
                    <p class="text-lg font-medium">Tidak ada hasil</p>
                    <p class="text-sm">Coba ubah kata kunci pencarian</p>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.className = 'transaction-row animate-fade-in';
        row.style.animationDelay = `${index * 0.05}s`;
        
        const categoryNames = {
            'makanan': '🍽️ Makanan',
            'transportasi': '🚗 Transportasi',
            'belanja': '🛒 Belanja',
            'tagihan': '📄 Tagihan',
            'kesehatan': '🏥 Kesehatan',
            'pendidikan': '📚 Pendidikan',
            'hiburan': '🎬 Hiburan',
            'gaji': '💼 Gaji',
            'bonus': '🎁 Bonus',
            'lainnya': '📝 Lainnya'
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${new Date(transaction.date).toLocaleDateString('id-ID')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === 'pemasukan' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${transaction.type === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${categoryNames[transaction.category] || transaction.category}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${
                transaction.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'
            }">
                ${transaction.type === 'pemasukan' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                ${transaction.description || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTransaction(${transaction.id})" class="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTransaction(${transaction.id})" class="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Report generation
function generateReport(period) {
    const startDate = new Date(document.getElementById('report-start-date').value);
    const endDate = new Date(document.getElementById('report-end-date').value);
    
    // Set date ranges based on period
    const now = new Date();
    switch(period) {
        case 'daily':
            startDate.setTime(now.getTime());
            endDate.setTime(now.getTime());
            break;
        case 'weekly':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            startDate.setTime(weekStart.getTime());
            endDate.setTime(now.getTime());
            break;
        case 'monthly':
            startDate.setDate(1);
            startDate.setMonth(now.getMonth());
            startDate.setFullYear(now.getFullYear());
            endDate.setTime(now.getTime());
            break;
        case 'yearly':
            startDate.setMonth(0);
            startDate.setDate(1);
            startDate.setFullYear(now.getFullYear());
            endDate.setTime(now.getTime());
            break;
    }
    
    // Update date inputs
    document.getElementById('report-start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('report-end-date').value = endDate.toISOString().split('T')[0];
    
    // Filter transactions by date range
    const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Calculate summary
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredTransactions.forEach(transaction => {
        if (transaction.type === 'pemasukan') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });
    
    const netIncome = totalIncome - totalExpense;
    
    // Update report summary
    const reportSummary = document.getElementById('report-summary');
    reportSummary.innerHTML = `
        <div class="stats-card rounded-2xl p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-semibold text-gray-600 mb-2">Total Pemasukan</h4>
                    <p class="text-3xl font-bold text-green-600">${formatCurrency(totalIncome)}</p>
                </div>
                <div class="gradient-success p-4 rounded-2xl">
                    <i class="fas fa-arrow-up text-white text-2xl"></i>
                </div>
            </div>
        </div>
        <div class="stats-card rounded-2xl p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-semibold text-gray-600 mb-2">Total Pengeluaran</h4>
                    <p class="text-3xl font-bold text-red-600">${formatCurrency(totalExpense)}</p>
                </div>
                <div class="gradient-secondary p-4 rounded-2xl">
                    <i class="fas fa-arrow-down text-white text-2xl"></i>
                </div>
            </div>
        </div>
        <div class="stats-card rounded-2xl p-6">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-semibold text-gray-600 mb-2">Saldo Bersih</h4>
                    <p class="text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(netIncome)}</p>
                </div>
                <div class="${netIncome >= 0 ? 'gradient-primary' : 'gradient-warning'} p-4 rounded-2xl">
                    <i class="fas ${netIncome >= 0 ? 'fa-chart-line' : 'fa-chart-line-down'} text-white text-2xl"></i>
                </div>
            </div>
        </div>
    `;
    
    // Show report results
    document.getElementById('report-results').classList.remove('hidden');
    
    // Generate report chart
    generateReportChart(filteredTransactions, period);
    
    // Switch to laporan tab if not already there
    showTab('laporan');
}

function generateReportChart(transactions, period) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    if (reportChart) {
        reportChart.destroy();
    }
    
    // Group transactions by period
    const groupedData = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        let key;
        
        switch(period) {
            case 'daily':
                key = date.toLocaleDateString('id-ID');
                break;
            case 'weekly':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = `Minggu ${weekStart.toLocaleDateString('id-ID')}`;
                break;
            case 'monthly':
                key = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                break;
            case 'yearly':
                key = date.getFullYear().toString();
                break;
        }
        
        if (!groupedData[key]) {
            groupedData[key] = { income: 0, expense: 0 };
        }
        
        if (transaction.type === 'pemasukan') {
            groupedData[key].income += transaction.amount;
        } else {
            groupedData[key].expense += transaction.amount;
        }
    });
    
    const labels = Object.keys(groupedData);
    const incomeData = labels.map(label => groupedData[label].income);
    const expenseData = labels.map(label => groupedData[label].expense);
    
    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pemasukan',
                data: incomeData,
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
                borderColor: '#4facfe',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }, {
                label: 'Pengeluaran',
                data: expenseData,
                backgroundColor: 'rgba(245, 87, 108, 0.8)',
                borderColor: '#f5576c',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Cloud sync functions
async function loadDataFromCloud() {
    if (!isOnline) {
        console.log('Offline - loading from local storage');
        return;
    }
    
    try {
        showNotification('Memuat data dari cloud... ☁️', 'info');
        
        const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get', {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const cloudData = await response.json();
            
            if (cloudData.success && cloudData.data && cloudData.data.length > 0) {
                // Merge cloud data with local data
                const cloudTransactions = cloudData.data;
                const localIds = transactions.map(t => t.id);
                
                // Add new transactions from cloud
                cloudTransactions.forEach(cloudTransaction => {
                    if (!localIds.includes(cloudTransaction.id)) {
                        transactions.push(cloudTransaction);
                    }
                });
                
                saveTransactions();
                showNotification('Data berhasil dimuat dari cloud! 🌐', 'success');
            }
        } else {
            console.log('Failed to load from cloud, using local data');
        }
    } catch (error) {
        console.error('Error loading from cloud:', error);
        showNotification('Menggunakan data lokal 📱', 'info');
    }
}

async function syncTransactionToCloud(transaction, action) {
    if (!isOnline) {
        // Add to pending syncs
        pendingSyncs.push({ transaction, action, timestamp: new Date().toISOString() });
        savePendingSyncs();
        return;
    }
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                data: transaction
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log(`Transaction ${action} synced successfully`);
            }
        } else {
            // Add to pending syncs if failed
            pendingSyncs.push({ transaction, action, timestamp: new Date().toISOString() });
            savePendingSyncs();
        }
    } catch (error) {
        console.error('Sync error:', error);
        // Add to pending syncs if error
        pendingSyncs.push({ transaction, action, timestamp: new Date().toISOString() });
        savePendingSyncs();
    }
}

async function syncPendingData() {
    if (!isOnline || pendingSyncs.length === 0) return;
    
    showNotification('Menyinkronkan data tertunda... 🔄', 'info');
    
    const syncsToProcess = [...pendingSyncs];
    pendingSyncs = [];
    savePendingSyncs();
    
    for (const sync of syncsToProcess) {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: sync.action,
                    data: sync.transaction
                })
            });
            
            if (!response.ok) {
                // Re-add to pending if failed
                pendingSyncs.push(sync);
            }
        } catch (error) {
            console.error('Sync error:', error);
            // Re-add to pending if error
            pendingSyncs.push(sync);
        }
    }
    
    savePendingSyncs();
    
    if (pendingSyncs.length === 0) {
        showNotification('Semua data berhasil disinkronkan! ✅', 'success');
    }
}

// Google Sheets integration
function testConnection() {
    if (!isOnline) {
        showNotification('Tidak ada koneksi internet! 📶', 'error');
        return;
    }
    
    showNotification('Menguji koneksi ke Google Apps Script... 🔗', 'info');
    
    fetch(GOOGLE_SCRIPT_URL + '?action=test', {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Koneksi berhasil! Siap untuk sinkronisasi 🔗', 'success');
        } else {
            showNotification('Koneksi gagal! Periksa URL Google Apps Script 🚫', 'error');
        }
    })
    .catch(error => {
        console.error('Connection test error:', error);
        showNotification('Koneksi gagal! Periksa URL Google Apps Script 🚫', 'error');
    });
}

function syncData() {
    if (!isOnline) {
        showNotification('Tidak ada koneksi internet! 📶', 'error');
        return;
    }
    
    showNotification('Memulai sinkronisasi penuh... 🔄', 'info');
    
    // Sync all transactions
    Promise.all(transactions.map(transaction => 
        syncTransactionToCloud(transaction, 'add')
    )).then(() => {
        showNotification('Sinkronisasi penuh berhasil! ☁️', 'success');
    }).catch(error => {
        console.error('Full sync error:', error);
        showNotification('Sinkronisasi gagal! Coba lagi nanti 🚫', 'error');
    });
}

// Data management functions
function exportData() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `moneytracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Data berhasil diekspor! 📁', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('Import data akan mengganti semua data yang ada. Lanjutkan?')) {
                    transactions = importedData;
                    saveTransactions();
                    updateDashboard();
                    updateTransactionsTable();
                    updateRecentTransactions();
                    showNotification('Data berhasil diimpor! 📥', 'success');
                }
            } catch (error) {
                showNotification('File tidak valid! Pastikan format JSON benar 🚫', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan!')) {
        transactions = [];
        saveTransactions();
        updateDashboard();
        updateTransactionsTable();
        updateRecentTransactions();
        showNotification('Semua data berhasil dihapus! 🗑️', 'success');
    }
}

function resetApp() {
    if (confirm('Reset aplikasi akan menghapus semua data dan pengaturan. Lanjutkan?')) {
        localStorage.clear();
        location.reload();
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-xl shadow-lg max-w-sm animate-scale-in ${
        type === 'success' ? 'gradient-success text-white' :
        type === 'error' ? 'gradient-secondary text-white' :
        'gradient-primary text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            } mr-3 text-lg"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Close modal when clicking outside
document.getElementById('edit-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

// Add CSS for fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
`;
document.head.appendChild(style);