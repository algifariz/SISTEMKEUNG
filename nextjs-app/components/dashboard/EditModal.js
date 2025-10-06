import { useState, useEffect } from 'react';

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
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} className="input-elegant w-full p-3 rounded-xl"></textarea>
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

export default EditModal;