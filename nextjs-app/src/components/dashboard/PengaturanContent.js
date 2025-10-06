const PengaturanContent = ({ onLogout }) => (
    <div className="card-elegant p-6 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan</h2>
        <button onClick={onLogout} className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-colors">
            <i className="fas fa-sign-out-alt mr-2"></i>Logout
        </button>
    </div>
);

export default PengaturanContent;