'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter, usePathname } from 'next/navigation'; // Importa usePathname
import { useEffect } from 'react';
import Link from 'next/link';

// Definiamo i nostri link della sidebar in un array per renderli più facili da gestire
const sidebarNavItems = [
  {
    title: "Gruppi",
    href: "/groups",
  },
  {
    title: "Notifiche",
    href: "/notifications",
  },
  {
    title: "Profilo",
    href: "/profile",
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Questo hook ci dà il percorso URL attuale

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center">SplitSmart</h2>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {sidebarNavItems.map((item) => {
              // Controlliamo se il percorso attuale inizia con l'href del link
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white font-semibold' // Stile per il link attivo
                        : 'hover:bg-gray-700' // Stile per il link inattivo
                      }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Pulsante di Logout */}
         <div className="mt-4">
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full flex items-center p-3 rounded-lg text-left hover:bg-red-700 transition-colors"
          >
            {/* Puoi aggiungere un'icona qui se vuoi */}
            Logout
          </button>
        </div>
      </aside>
      {/* Contenuto principale */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}