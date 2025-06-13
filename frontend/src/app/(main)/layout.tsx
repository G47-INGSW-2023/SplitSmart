'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Un componente "spinner" o di caricamento generico
const FullPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (user) {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar (la creeremo dopo) */}
        <aside className="w-64 p-4 bg-gray-800 text-white">
          <h2 className="text-xl font-bold">Smart Split</h2>
          <nav className="mt-8">
            <ul>
              <li className="p-2 rounded hover:bg-gray-700">Dashboard</li>
              <li className="p-2 rounded hover:bg-gray-700">Gruppi</li>
              <li className="p-2 rounded hover:bg-gray-700">Profilo</li>
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

  return <FullPageLoader />;
}