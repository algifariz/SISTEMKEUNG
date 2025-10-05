// Global variables
var transactions = [];
var filteredTransactions = [];
var currentPage = 1;
const rowsPerPage = 10;
var currentChart = null;
var reportChart = null;
var categoryChart = null;

// API URL
const API_URL = 'api/handler.php';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    document.getElementById('report-start-date').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today;
    
    // Set default transaction type
    setTransactionType('pemasukan');
    
    // Load data from the server
    loadDataFromServer();
    
    // Event listeners
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('edit-form').addEventListener('submit', updateTransaction);
    document.getElementById('search-transactions').addEventListener('input', filterTransactions);
    document.getElementById('filter-type').addEventListener('change', filterTransactions);
});

// Tab management
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.querySelectorAll('.tab-elegant').forEach(btn => {
        btn.classList.remove('active', 'text-indigo-600');
        btn.classList.add('text-gray-600');
    });
    document.getElementById(tabName + '-content').classList.remove('hidden');
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('active', 'text-indigo-600');
    activeTab.classList.remove('text-gray-600');
    
    if (tabName === 'dashboard') {
        updateDashboard();
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

// --- SERVER COMMUNICATION ---

async function loadDataFromServer() {
    try {
        const response = await fetch(API_URL, { method: 'GET' });
        const result = await response.json();

        if (result.success) {
            transactions = result.data;
            updateAllDisplays();
            showNotification('Data berhasil dimuat dari server! 💻', 'success');
        } else {
            showNotification(`Error loading data: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Tidak dapat terhubung ke server. Pastikan XAMPP berjalan.', 'error');
        console.error('Fetch error:', error);
    }
}

async function addTransaction(e) {
    e.preventDefault();
    
    const newTransaction = {
        type: document.getElementById('transaction-type').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        category: document.getElementById('transaction-category').value,
        date: document.getElementById('transaction-date').value,
        description: document.getElementById('transaction-description').value
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', data: newTransaction })
        });
        const result = await response.json();

        if (result.success) {
            transactions.push(result.data);
            updateAllDisplays();
            document.getElementById('transaction-form').reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
            setTransactionType('pemasukan');
            showNotification('Transaksi berhasil ditambahkan! 🎉', 'success');
            showTab('dashboard');
        } else {
            showNotification(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Gagal menambahkan transaksi. Periksa koneksi server.', 'error');
    }
}

async function updateTransaction(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const updatedTransaction = {
        id: id,
        type: document.getElementById('edit-type').value,
        amount: parseFloat(document.getElementById('edit-amount').value),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        description: document.getElementById('edit-description').value
    };

    showNotification('Memperbarui transaksi...', 'info');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', data: updatedTransaction })
        });
        const result = await response.json();

        if (result.success) {
            closeEditModal();
            showNotification('Transaksi berhasil diperbarui! ✨', 'success');
            // Reload all data from server to ensure UI is in sync
            await loadDataFromServer();
        } else {
            showNotification(`Gagal memperbarui: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Gagal memperbarui. Periksa koneksi server.', 'error');
        console.error('Update error:', error);
    }
}

async function deleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        return;
    }

    showNotification('Menghapus transaksi...', 'info');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        });
        const result = await response.json();

        if (result.success) {
            showNotification('Transaksi berhasil dihapus! 🗑️', 'success');
            // Reload all data from server to ensure UI is in sync
            await loadDataFromServer();
        } else {
            showNotification(`Gagal menghapus: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Gagal menghapus. Periksa koneksi server.', 'error');
        console.error('Delete error:', error);
    }
}

// --- UI UPDATES ---

function updateAllDisplays() {
    updateDashboard();
    filterTransactions();
    updateRecentTransactions();
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

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonthDate = new Date(now);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

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

    const transactionsUntilLastMonth = transactions.filter(t => new Date(t.date) < new Date(currentYear, currentMonth, 1));
    const totalsUntilLastMonth = calculateTotals(transactionsUntilLastMonth);
    const balanceAtEndOfLastMonth = totalsUntilLastMonth.income - totalsUntilLastMonth.expense;
    
    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('hero-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyTotals.income);
    document.getElementById('monthly-expense').textContent = formatCurrency(monthlyTotals.expense);
    document.getElementById('total-transactions').textContent = transactions.length;
    
    const percentageChangeElement = document.querySelector('#current-balance + .text-xs');
    const hasLastMonthData = transactions.some(t => {
        const d = new Date(t.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    if (hasLastMonthData) {
        let percentageChange = 0;
        if (balanceAtEndOfLastMonth !== 0) {
            percentageChange = ((currentBalance - balanceAtEndOfLastMonth) / Math.abs(balanceAtEndOfLastMonth)) * 100;
        } else if (currentBalance !== 0) {
            percentageChange = 100;
        }

        const isPositiveChange = currentBalance >= balanceAtEndOfLastMonth;
        const absPercentageChange = Math.abs(percentageChange).toFixed(1);
        const icon = isPositiveChange ? 'fa-arrow-up' : 'fa-arrow-down';
        const color = isPositiveChange ? 'text-green-600' : 'text-red-600';
        const text = isPositiveChange ? `+${absPercentageChange}% dari bulan lalu` : `-${absPercentageChange}% dari bulan lalu`;

        percentageChangeElement.className = `text-xs ${color} mt-1`;
        percentageChangeElement.innerHTML = `<i class="fas ${icon} mr-1"></i>${text}`;
    } else {
        percentageChangeElement.className = 'text-xs text-gray-500 mt-1';
        percentageChangeElement.innerHTML = 'Data bulan lalu tidak tersedia';
    }

    updateCharts();
}

function updateCharts() {
    // Income vs Expense Chart
    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    if (currentChart) currentChart.destroy();
    
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
        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate.getMonth() === month && transactionDate.getFullYear() === year) {
                if (t.type === 'pemasukan') monthIncome += parseFloat(t.amount);
                else monthExpense += parseFloat(t.amount);
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
                fill: true
            }, {
                label: 'Pengeluaran',
                data: expenseData,
                borderColor: '#f5576c',
                backgroundColor: 'rgba(245, 87, 108, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    // Category Chart
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    const categoryData = {};
    transactions.forEach(t => {
        if (t.type === 'pengeluaran') {
            categoryData[t.category] = (categoryData[t.category] || 0) + parseFloat(t.amount);
        }
    });
    
    categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData).map(key => getCategoryDisplayName(key)),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
    });
}

function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');

    // Sort transactions by date in descending order and take the latest 5
    const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada transaksi</p>';
        return;
    }
    
    // Generate the HTML for the 5 recent transactions
    container.innerHTML = recent.map(t => `
        <div class="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="flex items-center">
                <div class="p-2 rounded-full mr-3 ${t.type === 'pemasukan' ? 'bg-green-100' : 'bg-red-100'}">
                    <i class="fas ${t.type === 'pemasukan' ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'}"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-800">${getCategoryDisplayName(t.category)}</p>
                    <p class="text-xs text-gray-500">${new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
            </div>
            <span class="text-sm font-semibold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}">
                ${t.type === 'pemasukan' ? '+' : '-'}${formatCurrency(t.amount)}
            </span>
        </div>
    `).join('');
}

function displayTransactions() {
    const tbody = document.getElementById('transactions-table');
    tbody.innerHTML = '';

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">Tidak ada transaksi yang cocok dengan kriteria Anda.</td></tr>`;
        setupPagination(0, 0); // Clear pagination
        return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = filteredTransactions.slice(startIndex, endIndex);

    paginatedItems.forEach(t => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50/50 transition-colors";
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${new Date(t.date).toLocaleDateString('id-ID')}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${t.type === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${getCategoryDisplayName(t.category)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}">
                ${t.type === 'pemasukan' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title="${t.description || ''}">${t.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTransaction(${t.id})" class="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50 transition-colors" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTransaction(${t.id})" class="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupPagination(filteredTransactions.length, Math.ceil(filteredTransactions.length / rowsPerPage));
}

function setupPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = ''; // Clear previous content

    if (totalItems === 0) {
        return; // Do not display anything if there are no items
    }

    // Always display the status text
    const statusSpan = document.createElement('span');
    statusSpan.className = 'text-sm text-gray-700';
    statusSpan.innerHTML = `
        Menampilkan <span class="font-semibold">${Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)}</span>
        sampai <span class="font-semibold">${Math.min(currentPage * rowsPerPage, totalItems)}</span>
        dari <span class="font-semibold">${totalItems}</span> hasil`;
    paginationContainer.appendChild(statusSpan);

    // Only display buttons if there is more than one page
    if (totalPages > 1) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'inline-flex mt-2 xs:mt-0';
        buttonsDiv.innerHTML = `
            <button onclick="changePage(${currentPage - 1})" class="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-l hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-arrow-left mr-2"></i>Prev
            </button>
            <button onclick="changePage(${currentPage + 1})" class="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-r border-0 border-l border-indigo-600 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
                Next<i class="fas fa-arrow-right ml-2"></i>
            </button>
        `;
        paginationContainer.appendChild(buttonsDiv);
    }
}

function changePage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayTransactions();
}

function filterTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;

    // Filter transactions
    let tempFiltered = transactions.filter(t => {
        const description = t.description || '';
        const category = t.category || '';
        const matchesSearch = description.toLowerCase().includes(searchTerm) ||
                              getCategoryDisplayName(category).toLowerCase().includes(searchTerm);
        const matchesType = !filterType || t.type === filterType;
        return matchesSearch && matchesType;
    });

    // Sort the filtered transactions by date
    tempFiltered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions = tempFiltered;
    
    // Reset to the first page whenever a filter is applied
    currentPage = 1;
    displayTransactions();
}

// --- REPORTING ---

function generateReport(period) {
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    const now = new Date();
    let startDate, endDate;

    switch(period) {
        case 'daily':
            startDate = new Date(now.setHours(0,0,0,0));
            endDate = new Date(now.setHours(23,59,59,999));
            break;
        case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            startDate.setHours(0,0,0,0);
            endDate = new Date();
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date();
            break;
        default: // Custom range
            startDate = new Date(startDateInput.value);
            endDate = new Date(endDateInput.value);
    }
    
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
    
    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
    });
    
    let totalIncome = 0, totalExpense = 0;
    filtered.forEach(t => {
        if (t.type === 'pemasukan') totalIncome += parseFloat(t.amount);
        else totalExpense += parseFloat(t.amount);
    });
    const netIncome = totalIncome - totalExpense;
    
    document.getElementById('report-summary').innerHTML = `
        <div class="stats-card p-6"><h4>Total Pemasukan</h4><p class="text-3xl font-bold text-green-600">${formatCurrency(totalIncome)}</p></div>
        <div class="stats-card p-6"><h4>Total Pengeluaran</h4><p class="text-3xl font-bold text-red-600">${formatCurrency(totalExpense)}</p></div>
        <div class="stats-card p-6"><h4>Saldo Bersih</h4><p class="text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(netIncome)}</p></div>
    `;
    
    document.getElementById('report-results').classList.remove('hidden');
    generateReportChart(filtered, period);
    showTab('laporan');
}

function generateReportChart(data, period) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    if (reportChart) reportChart.destroy();
    
    // Logic to group data for chart would go here
    // For simplicity, we'll just show total income/expense in the chart
    let totalIncome = data.filter(t=>t.type==='pemasukan').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    let totalExpense = data.filter(t=>t.type==='pengeluaran').reduce((sum, t) => sum + parseFloat(t.amount), 0);

    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Laporan'],
            datasets: [{
                label: 'Pemasukan',
                data: [totalIncome],
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
            }, {
                label: 'Pengeluaran',
                data: [totalExpense],
                backgroundColor: 'rgba(245, 87, 108, 0.8)',
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}


// --- UTILITY FUNCTIONS ---

function getCategoryDisplayName(key) {
    const categoryNames = {
        'makanan': '🍽️ Makanan', 'transportasi': '🚗 Transportasi', 'belanja': '🛒 Belanja',
        'tagihan': '📄 Tagihan', 'kesehatan': '🏥 Kesehatan', 'pendidikan': '📚 Pendidikan',
        'hiburan': '🎬 Hiburan', 'gaji': '💼 Gaji', 'bonus': '🎁 Bonus', 'lainnya': '📝 Lainnya'
    };
    return categoryNames[key] || key;
}

function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) {
        amount = 0;
    }
    // Use the built-in 'currency' style with 'IDR' to get the "Rp" prefix
    // and the correct dot separators for thousands.
    // The `replace(/,00$/, '')` removes the trailing ",00" for whole numbers.
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-xl shadow-lg max-w-sm animate-scale-in ${
        type === 'success' ? 'gradient-success text-white' :
        type === 'error' ? 'gradient-secondary text-white' :
        'gradient-primary text-white'
    }`;
    notification.innerHTML = `<div class="flex items-center"><i class="fas ${
        type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
        'fa-info-circle'
    } mr-3 text-lg"></i><span class="font-medium">${message}</span></div>`;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Close modal when clicking outside
document.getElementById('edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
    @keyframes scale-in {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in { animation: scale-in 0.3s ease-out; }
`;
document.head.appendChild(style);

// --- DATA MANAGEMENT ---

function exportData() {
    if (transactions.length === 0) {
        showNotification('Tidak ada data untuk diekspor.', 'info');
        return;
    }

    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `money_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data berhasil diekspor! 📄', 'success');
}

function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedTransactions = JSON.parse(event.target.result);
                if (!Array.isArray(importedTransactions)) {
                    throw new Error("Format JSON tidak valid.");
                }

                // Optional: Clear existing data before import
                if (confirm('Hapus data lama sebelum mengimpor?')) {
                    await clearAllData(false); // silent clear
                }

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'batch_add', data: importedTransactions })
                });
                const result = await response.json();

                if (result.success) {
                    await loadDataFromServer();
                    showNotification('Data berhasil diimpor! 🚀', 'success');
                } else {
                    showNotification(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                showNotification(`Gagal mengimpor data: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };

    fileInput.click();
}

async function clearAllData(confirmFirst = true) {
    const confirmed = confirmFirst
        ? confirm('APAKAH ANDA YAKIN? Semua data transaksi akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.')
        : true;

    if (confirmed) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' })
            });
            const result = await response.json();

            if (result.success) {
                transactions = [];
                updateAllDisplays();
                if (confirmFirst) showNotification('Semua data berhasil dihapus! 🧹', 'success');
            } else {
                showNotification(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            showNotification('Gagal menghapus data. Periksa koneksi server.', 'error');
        }
    }
}

function resetApp() {
    if (confirm('Apakah Anda yakin ingin mereset aplikasi? Ini akan menghapus semua data transaksi.')) {
        clearAllData();
    }
}

// These functions are no longer relevant in the PHP/MySQL version
function testConnection() {
    showNotification('Fungsi ini tidak relevan untuk versi server.', 'info');
}
function syncData() {
     showNotification('Fungsi ini tidak relevan untuk versi server.', 'info');
}
function loadDataFromCloud() {
     showNotification('Fungsi ini tidak relevan untuk versi server.', 'info');
}