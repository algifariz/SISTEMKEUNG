import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 m-4 text-center">
        <h1 className="text-4xl font-bold mb-4 text-indigo-600">
          <i className="fas fa-coins mr-2 text-yellow-400"></i>
          Welcome to MoneyTracker
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your personal finance companion.
        </p>
        <div className="space-y-4">
          <Link href="/login" className="w-full block btn-elegant text-white py-3 px-6 rounded-xl font-semibold text-lg">
              Login
          </Link>
          <Link href="/register" className="w-full block bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300">
              Register
          </Link>
        </div>
      </div>
    </div>
  );
}