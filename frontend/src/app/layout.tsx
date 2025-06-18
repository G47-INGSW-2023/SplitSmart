import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Importa i tuoi provider
import { AuthProvider } from '@/lib/authContext'; 
import QueryProvider from '@/lib/queryProvider'; // <-- IMPORTA QUI

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartSplit',
  description: 'Manage the expenses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} select-none cursor-default`}>
            {/* 2. Avvolgi l'applicazione con QueryProvider. 
            Deve essere all'esterno di qualsiasi componente che usa useQuery/useMutation.
            Metterlo qui è la scelta più sicura. */}
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}