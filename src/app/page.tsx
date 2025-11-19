export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900">
          Welcome to SGTrading
        </h1>
        <p className="mt-3 text-2xl text-gray-600">
          The best platform for all your trading needs.
        </p>
        <a
          href="/register"
          className="px-6 py-3 mt-8 text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Get Started
        </a>
      </main>
    </div>
  );
}
