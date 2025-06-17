'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

// Questa funzione crea una nuova istanza di QueryClient per ogni sessione utente,
// il che previene la condivisione di dati tra utenti diversi.
export default function QueryProvider({ children }: { children: ReactNode }) {
  // Usiamo useState per assicurarci che il client venga creato una sola volta per componente.
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    // Il Provider riceve il client e lo rende disponibile a tutti i componenti figli.
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}