'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter, usePathname } from 'next/navigation'; 
import { useEffect } from 'react';
import Link from 'next/link';

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
  { 
    title: "Amici", 
    href: "/friends" 
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, unreadNotificationsCount } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center">SplitSmart</h2>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {sidebarNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white font-semibold' 
                        : 'hover:bg-gray-700' 
                      }`}
                  >
                    <span>{item.title}</span>
                  
                    {item.href === '/notifications' && unreadNotificationsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}                  
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
         <div className="mt-4">
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="w-full flex items-center p-3 rounded-lg text-left hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}