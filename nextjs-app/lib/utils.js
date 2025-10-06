export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
};

export const getCategoryDisplayName = (key) => {
    const names = { 'makanan': '🍽️ Makanan', 'transportasi': '🚗 Transportasi', 'belanja': '🛒 Belanja', 'tagihan': '📄 Tagihan', 'kesehatan': '🏥 Kesehatan', 'pendidikan': '📚 Pendidikan', 'hiburan': '🎬 Hiburan', 'gaji': '💼 Gaji', 'bonus': '🎁 Bonus', 'lainnya': '📝 Lainnya' };
    return names[key] || key;
};