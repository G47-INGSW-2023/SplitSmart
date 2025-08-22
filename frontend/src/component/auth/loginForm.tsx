// component/auth/loginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Input } from '../ui/input'; // Assicurati che il percorso sia corretto
import { Button } from '../ui/button'; // Assicurati che il percorso sia corretto
import Link from 'next/link';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      router.push('/groups'); // Reindirizza alla pagina dei gruppi dopo il login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenziali non valide.');
    }
  };

  return (
    <div className="w-full max-w-sm p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-md m-4 sm:m-0">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bentornato!</h1>
        <p className="text-gray-500 mt-2">Accedi al tuo account per continuare.</p>
      </div>  

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="text-gray-400"/>
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="text-gray-400"/>
        </div>

        {error && <p className="text-sm text-center text-red-600 font-medium">{error}</p>}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Accesso in corso...' : 'Accedi'}
        </Button>
      </form>

      <p className="text-sm text-center text-gray-600">
        Non hai un account?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  );
};