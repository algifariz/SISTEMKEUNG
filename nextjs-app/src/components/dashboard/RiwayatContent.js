import { formatCurrency, getCategoryDisplayName } from '@/lib/utils';

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

export default RiwayatContent;