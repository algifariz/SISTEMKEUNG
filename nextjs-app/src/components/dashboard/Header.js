import { formatCurrency } from '@/lib/utils';

const Header = ({ transactions }) => {
    const balance = transactions.reduce((acc, t) => acc + (t.type === 'pemasukan' ? t.amount : -t.amount), 0);
    return (
        <header className="hero-bg text-white relative">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="animate-slide-up text-center sm:text-left mb-6 sm:mb-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 relative z-10">
                            <i className="fas fa-coins mr-2 sm:mr-4 text-yellow-300"></i>
                            MoneyTracker
                        </h1>
                        <p className="text-lg sm:text-xl text-indigo-100 relative z-10">Kelola keuangan dengan elegan</p>
                    </div>
                    <div className="hidden md:block animate-fade-in">
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
                                <div className="text-sm text-indigo-200">Saldo Saat Ini</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-20 h-20 bg-white opacity-5 rounded-full"></div>
        </header>
    );
};

export default Header;