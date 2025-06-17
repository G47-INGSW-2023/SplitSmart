'use client';

import Link from 'next/link'; 
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode; }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se non sta caricando e l'utente NON è autenticato, reindirizza
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Questa logica rimane per proteggere la rotta durante la navigazione
  if (!isAuthenticated) {
      // Puoi mostrare uno spinner o null mentre reindirizza
      return <div>Caricamento...</div>;
  }
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (la creeremo dopo) */}
      <aside className="w-64 p-4 bg-gray-800 text-white">
        <h2 className="text-xl font-bold">Smart Split</h2>
        <nav className="mt-8">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/groups" className="block p-2 rounded hover:bg-gray-700">
              Gruppi
            </Link>
          </li>
          <li>
            <Link href="/profile" className="block p-2 rounded hover:bg-gray-700">
              Profilo
            </Link>
          </li>
        </ul>
      </nav>
        <div className="mt-auto absolute bottom-4">
            <button onClick={() => {
              logout();
              router.push('/login');
            }} className="w-full text-left p-2 rounded hover:bg-red-700">
              Logout
          </button>
        </div>
      </aside>

      {/* Contenuto principale */}
      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}

