const Navigation = ({ activeTab, setActiveTab }) => {
    const tabs = ['dashboard', 'transaksi', 'riwayat', 'laporan', 'pengaturan'];
    const icons = ['fa-chart-pie', 'fa-plus-circle', 'fa-history', 'fa-chart-bar', 'fa-cog'];

    return (
         <nav className="sidebar-blur sticky top-0 z-40 border-b border-white/20">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex space-x-2 overflow-x-auto py-3 sm:py-4">
                    {tabs.map((tab, i) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-elegant px-4 py-2 sm:px-6 sm:py-3 font-medium transition-all duration-300 flex-1 sm:flex-none flex items-center justify-center ${activeTab === tab ? 'active text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                        >
                            <i className={`fas ${icons[i]} sm:mr-2`}></i>
                            <span className="hidden sm:inline capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;