import Header from '@/components/header';
import Leaderboard from '@/components/leaderboard';
import SnackCalculator from '@/components/snack-calculator';

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-8 md:p-12 font-body">
      <div className="max-w-7xl mx-auto space-y-12">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">
            <SnackCalculator />
          </div>
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </div>
    </main>
  );
}
