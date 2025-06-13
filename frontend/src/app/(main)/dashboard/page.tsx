'use client';

import { useAuth } from '@/lib/authContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user ? (
        <p className="mt-4 text-lg">
          Benvenuto, <span className="font-semibold">{user.nome}</span>!
        </p>
      ) : (
        <p>Caricamento dati utente...</p>
      )}
      {/* Qui andranno i componenti come BalanceSummary, RecentActivity etc. */}
    </div>
  );
}