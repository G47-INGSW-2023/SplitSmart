'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter, usePathname } from 'next/navigation'; 
import { useEffect } from 'react';
import Link from 'next/link';
import { Users, User, Bell, UserCircle } from 'lucide-react'; 

const sidebarNavItems = [
  {
    title: "Gruppi",
    href: "/groups",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Amici",
    href: "/friends",
    icon: <User className="h-5 w-5" />, 
  },
  {
    title: "Notifiche",
    href: "/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    title: "Profilo",
    href: "/profile",
    icon: <UserCircle className="h-5 w-5" />,
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, unreadNotificationsCount } = useAuth();
  const router = useRouter();

  return (
  <aside className="hidden lg:flex w-64 bg-gray-800 text-white flex-col p-4">
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
  );
};

const BottomBar = () => {
  const pathname = usePathname();
  const { unreadNotificationsCount } = useAuth(); // Prendiamo il conteggio

  return (
    // Mostra su mobile, nascondi su desktop (`lg:hidden`)
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-200 shadow-t-md z-10">
      <div className="flex justify-around">
        {sidebarNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-gray-700'}`}>
              <div className="relative">
                {item.href === '/notifications' && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>{item.icon}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* La sidebar per desktop viene renderizzata qui */}
      <Sidebar />
      
      {/* Contenuto principale */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {/* Aggiungiamo un padding-bottom su mobile per non far coprire il contenuto dalla bottom bar */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
      
      {/* La bottom bar per mobile viene renderizzata qui */}
      <BottomBar />
    </div>
  );
}