const FloatingActionButton = ({ setActiveTab }) => (
    <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setActiveTab('transaksi')} className="btn-elegant text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <i className="fas fa-plus text-2xl"></i>
        </button>
    </div>
);

export default FloatingActionButton;