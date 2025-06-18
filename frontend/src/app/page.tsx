'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

// Questa pagina non mostrerà mai nulla, il suo unico scopo è reindirizzare.
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Aspetta che lo stato di autenticazione sia definito
    if (!isLoading) {
      if (isAuthenticated) {
        // Se l'utente è loggato, vai alla lista dei gruppi
        router.replace('/groups');
      } else {
        // Se non è loggato, vai alla pagina di login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostra uno spinner o una pagina vuota mentre avviene il reindirizzamento
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}