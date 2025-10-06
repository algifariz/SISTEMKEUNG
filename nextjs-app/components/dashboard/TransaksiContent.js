import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

export default TransaksiContent;