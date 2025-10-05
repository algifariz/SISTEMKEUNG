// --- GLOBAL STATE ---
var transactions = [];
var filteredTransactions = [];
var currentPage = 1;
const rowsPerPage = 10;
var currentChart = null;
var reportChart = null;
var categoryChart = null;

// --- APPLICATION INITIALIZATION ---

document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
    addGlobalStyles();
    const path = window.location.pathname.split("/").pop();

    // Page-specific initializations
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        checkAuth(false); // On login page, redirect if already logged in
    } else if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        checkAuth(false); // On register page, redirect if already logged in
    } else if (path.includes('dashboard.html')) {
        checkAuth(true); // On dashboard, redirect if not logged in
    }
});

// --- AUTHENTICATION LOGIC (Supabase) ---

async function checkAuth(isDashboard) {
    const { data: { session } } = await supabase.auth.getSession();

    if (isDashboard) {
        if (!session) {
            // Not logged in, redirect to login
            window.location.href = 'index.html';
        } else {
            // User is authenticated, proceed to load dashboard data
            initializeDashboard();
        }
    } else {
        // On login/register page
        if (session) {
            // Already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // We'll use the username as the email for Supabase auth
    const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
    });

    if (error) {
        showNotification(error.message, 'error');
    } else {
        showNotification('Login berhasil! Mengarahkan ke dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signUp({
        email: username, // Using username as email
        password: password
    });

    if (error) {
        showNotification(error.message, 'error');
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        showNotification('Registrasi gagal: Pengguna dengan email ini sudah ada.', 'error');
    }
    else {
        showNotification('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

async function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showNotification('Logout gagal: ' + error.message, 'error');
        } else {
            showNotification('Anda telah keluar.', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}


// --- DASHBOARD INITIALIZATION ---

function initializeDashboard() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    document.getElementById('report-start-date').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today;

    // Set default transaction type
    setTransactionType('pemasukan');
    
    // Load data from the server
    loadDataFromServer();
    
    // Attach dashboard-specific event listeners
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('edit-form').addEventListener('submit', updateTransaction);
    document.getElementById('search-transactions').addEventListener('input', filterTransactions);
    document.getElementById('filter-type').addEventListener('change', filterTransactions);
    document.getElementById('edit-modal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
}


// --- SERVER COMMUNICATION (DATA) ---

async function loadDataFromServer() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        showNotification(`Error loading data: ${error.message}`, 'error');
        if (error.code === '42P01') { // undefined_table
             showNotification("Tabel 'transactions' tidak ditemukan. Apakah Anda sudah menjalankan skema SQL di Supabase?", 'error');
        }
    } else {
        transactions = data;
        updateAllDisplays();
        showNotification('Data berhasil dimuat! 💻', 'success');
    }
}

async function addTransaction(e) {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showNotification('Error: Anda harus login untuk menambahkan transaksi.', 'error');
        return;
    }

    const newTransaction = {
        user_id: user.id,
        type: document.getElementById('transaction-type').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        category: document.getElementById('transaction-category').value,
        date: document.getElementById('transaction-date').value,
        description: document.getElementById('transaction-description').value
    };
    
    const { error } = await supabase
        .from('transactions')
        .insert([newTransaction]);

    if (error) {
        showNotification(`Error: ${error.message}`, 'error');
    } else {
        await loadDataFromServer();
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        setTransactionType('pemasukan');
        showNotification('Transaksi berhasil ditambahkan! 🎉', 'success');
        showTab('dashboard');
    }
}

async function updateTransaction(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const updatedTransaction = {
        // user_id is not needed here due to RLS policies
        type: document.getElementById('edit-type').value,
        amount: parseFloat(document.getElementById('edit-amount').value),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        description: document.getElementById('edit-description').value
    };

    const { error } = await supabase
        .from('transactions')
        .update(updatedTransaction)
        .match({ id: id });

    if (error) {
        showNotification(`Gagal memperbarui: ${error.message}`, 'error');
    } else {
        closeEditModal();
        showNotification('Transaksi berhasil diperbarui! ✨', 'success');
        await loadDataFromServer();
    }
}

async function deleteTransaction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        return;
    }

    const { error } = await supabase
        .from('transactions')
        .delete()
        .match({ id: id });

    if (error) {
        showNotification(`Gagal menghapus: ${error.message}`, 'error');
    } else {
        showNotification('Transaksi berhasil dihapus! 🗑️', 'success');
        await loadDataFromServer();
    }
}

// --- UI & DISPLAY LOGIC (Largely unchanged) ---

function updateAllDisplays() {
    updateDashboard();
    filterTransactions();
    updateRecentTransactions();
}

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
    if (!document.getElementById('current-balance')) return; // Exit if dashboard elements aren't on the page

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

    const prevMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    const prevMonthTotals = calculateTotals(prevMonthTransactions);

    const transactionsUntilLastMonth = transactions.filter(t => new Date(t.date) < new Date(currentYear, currentMonth, 1));
    const totalsUntilLastMonth = calculateTotals(transactionsUntilLastMonth);
    const balanceAtEndOfLastMonth = totalsUntilLastMonth.income - totalsUntilLastMonth.expense;
    
    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('hero-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyTotals.income);
    document.getElementById('monthly-expense').textContent = formatCurrency(monthlyTotals.expense);
    document.getElementById('total-transactions').textContent = transactions.length;
    
    const updatePercentage = (elementId, currentValue, prevValue, higherIsBetter) => {
        const element = document.getElementById(elementId);
        if (prevValue === 0 && currentValue === 0) {
            element.className = 'text-xs text-gray-500 mt-1';
            element.innerHTML = `<i class="fas fa-info-circle mr-1"></i>Data bulan lalu tidak tersedia`;
            return;
        }

        let percentageChange = 0;
        if (prevValue !== 0) {
            percentageChange = ((currentValue - prevValue) / Math.abs(prevValue)) * 100;
        } else if (currentValue !== 0) {
            percentageChange = 100;
        }

        const isPositive = (higherIsBetter && percentageChange >= 0) || (!higherIsBetter && percentageChange <= 0);
        const isNeutral = percentageChange === 0;

        let icon, color, text;
        if (isNeutral) {
            icon = 'fa-minus';
            color = 'text-gray-500';
            text = `Sama seperti bulan lalu`;
        } else {
            icon = percentageChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            color = isPositive ? 'text-green-600' : 'text-red-600';
            text = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}% dari bulan lalu`;
        }

        element.className = `text-xs ${color} mt-1`;
        element.innerHTML = `<i class="fas ${icon} mr-1"></i>${text}`;
    };

    updatePercentage('current-balance-percentage', currentBalance, balanceAtEndOfLastMonth, true);
    updatePercentage('monthly-income-percentage', monthlyTotals.income, prevMonthTotals.income, true);
    updatePercentage('monthly-expense-percentage', monthlyTotals.expense, prevMonthTotals.expense, false);

    const expenseTargetPercent = monthlyTotals.income > 0 ? (monthlyTotals.expense / monthlyTotals.income) * 100 : 0;
    const savingsTargetPercent = monthlyTotals.income > 0 ? ((monthlyTotals.income - monthlyTotals.expense) / monthlyTotals.income) * 100 : 0;

    document.getElementById('expense-target-percentage').textContent = `${expenseTargetPercent.toFixed(0)}%`;
    document.getElementById('expense-target-bar').style.width = `${Math.min(expenseTargetPercent, 100)}%`;

    document.getElementById('savings-target-percentage').textContent = `${savingsTargetPercent.toFixed(0)}%`;
    document.getElementById('savings-target-bar').style.width = `${Math.max(savingsTargetPercent, 0)}%`;

    updateCharts();
}

function updateCharts() {
    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    if (currentChart) currentChart.destroy();
    
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
    
    currentChart = new Chart(ctx1, {
        type: 'line',
        data: { labels: last6Months, datasets: [
            { label: 'Pemasukan', data: incomeData, borderColor: '#4facfe', backgroundColor: 'rgba(79, 172, 254, 0.1)', tension: 0.4, fill: true },
            { label: 'Pengeluaran', data: expenseData, borderColor: '#f5576c', backgroundColor: 'rgba(245, 87, 108, 0.1)', tension: 0.4, fill: true }
        ]},
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    const categoryData = transactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    
    categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData).map(getCategoryDisplayName),
            datasets: [{ data: Object.values(categoryData), backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
    });
}

function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada transaksi</p>';
        return;
    }
    
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
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">Tidak ada transaksi.</td></tr>`;
        setupPagination(0, 0);
        return;
    }

    const paginatedItems = filteredTransactions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    paginatedItems.forEach(t => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50/50 transition-colors";
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${new Date(t.date).toLocaleDateString('id-ID')}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${t.type === 'pemasukan' ? '💰 Pemasukan' : '💸 Pengeluaran'}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${getCategoryDisplayName(t.category)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}">${t.type === 'pemasukan' ? '+' : '-'}${formatCurrency(t.amount)}</td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title="${t.description || ''}">${t.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editTransaction(${t.id})" class="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-lg hover:bg-indigo-50" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTransaction(${t.id})" class="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupPagination(filteredTransactions.length, Math.ceil(filteredTransactions.length / rowsPerPage));
}

function setupPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = '';

    if (totalItems === 0) return;

    const statusSpan = document.createElement('span');
    statusSpan.className = 'text-sm text-gray-700';
    statusSpan.innerHTML = `Menampilkan <span class="font-semibold">${Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)}</span> sampai <span class="font-semibold">${Math.min(currentPage * rowsPerPage, totalItems)}</span> dari <span class="font-semibold">${totalItems}</span> hasil`;
    paginationContainer.appendChild(statusSpan);

    if (totalPages > 1) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'inline-flex mt-2 xs:mt-0';
        buttonsDiv.innerHTML = `
            <button onclick="changePage(${currentPage - 1})" class="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-l hover:bg-indigo-600 disabled:bg-gray-300" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
            <button onclick="changePage(${currentPage + 1})" class="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-r border-0 border-l border-indigo-600 hover:bg-indigo-600 disabled:bg-gray-300" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
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

    filteredTransactions = transactions.filter(t => {
        const description = t.description || '';
        const category = t.category || '';
        const matchesSearch = description.toLowerCase().includes(searchTerm) || getCategoryDisplayName(category).toLowerCase().includes(searchTerm);
        const matchesType = !filterType || t.type === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    currentPage = 1;
    displayTransactions();
}

// --- REPORTING ---

function generateReport(period) {
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');
    const now = new Date();
    let startDate, endDate = new Date();

    switch(period) {
        case 'daily': startDate = new Date(now.setHours(0,0,0,0)); break;
        case 'weekly': startDate = new Date(now.setDate(now.getDate() - now.getDay())); startDate.setHours(0,0,0,0); break;
        case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'yearly': startDate = new Date(now.getFullYear(), 0, 1); break;
        default: startDate = new Date(startDateInput.value); endDate = new Date(endDateInput.value);
    }
    
    startDateInput.valueAsDate = startDate;
    endDateInput.valueAsDate = endDate;
    
    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
    });
    
    const { income, expense } = calculateTotals(filtered);
    const netIncome = income - expense;
    
    document.getElementById('report-summary').innerHTML = `
        <div class="stats-card p-6"><h4>Total Pemasukan</h4><p class="text-3xl font-bold text-green-600">${formatCurrency(income)}</p></div>
        <div class="stats-card p-6"><h4>Total Pengeluaran</h4><p class="text-3xl font-bold text-red-600">${formatCurrency(expense)}</p></div>
        <div class="stats-card p-6"><h4>Saldo Bersih</h4><p class="text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(netIncome)}</p></div>
    `;
    
    document.getElementById('report-results').classList.remove('hidden');
    generateReportChart(filtered);
    showTab('laporan');
}

function generateReportChart(data) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    if (reportChart) reportChart.destroy();
    
    const { income, expense } = calculateTotals(data);

    reportChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Laporan'], datasets: [
            { label: 'Pemasukan', data: [income], backgroundColor: 'rgba(79, 172, 254, 0.8)' },
            { label: 'Pengeluaran', data: [expense], backgroundColor: 'rgba(245, 87, 108, 0.8)' }
        ]},
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function calculateTotals(data) {
    return data.reduce((acc, t) => {
        if (t.type === 'pemasukan') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });
}

// --- UTILITY & DATA MANAGEMENT ---

function getCategoryDisplayName(key) {
    const names = { 'makanan': '🍽️ Makanan', 'transportasi': '🚗 Transportasi', 'belanja': '🛒 Belanja', 'tagihan': '📄 Tagihan', 'kesehatan': '🏥 Kesehatan', 'pendidikan': '📚 Pendidikan', 'hiburan': '🎬 Hiburan', 'gaji': '💼 Gaji', 'bonus': '🎁 Bonus', 'lainnya': '📝 Lainnya' };
    return names[key] || key;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-xl shadow-lg max-w-sm animate-scale-in ${type === 'success' ? 'gradient-success' : type === 'error' ? 'gradient-secondary' : 'gradient-primary'} text-white`;
    notification.innerHTML = `<div class="flex items-center"><i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3 text-lg"></i><span class="font-medium">${message}</span></div>`;
    
    container.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.9); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
    `;
    document.head.appendChild(style);
}

async function clearAllData() {
    if (confirm('APAKAH ANDA YAKIN? Semua data transaksi Anda akan dihapus permanen.')) {
        // RLS policy will ensure only the user's own data is deleted.
        const { error } = await supabase
            .from('transactions')
            .delete()
            .neq('id', -1); // Dummy condition to delete all matched rows by RLS

        if (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } else {
            await loadDataFromServer();
            showNotification('Semua data berhasil dihapus! 🧹', 'success');
        }
    }
}

function exportData() {
    if (transactions.length === 0) {
        showNotification('Tidak ada data untuk diekspor.', 'info');
        return;
    }
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Data berhasil diekspor! 📄', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!Array.isArray(importedData)) throw new Error("Format JSON tidak valid.");

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Anda harus login untuk mengimpor data.");

                if (confirm('Hapus data lama sebelum mengimpor?')) {
                    await clearAllData();
                }

                // Add user_id to each transaction and remove any existing id
                const dataToInsert = importedData.map(({ id, ...t }) => ({
                    ...t,
                    user_id: user.id
                }));

                const { error } = await supabase
                    .from('transactions')
                    .insert(dataToInsert);

                if (error) {
                    throw error;
                }

                await loadDataFromServer();
                showNotification('Data berhasil diimpor! 🚀', 'success');

            } catch (error) {
                showNotification(`Gagal impor: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}