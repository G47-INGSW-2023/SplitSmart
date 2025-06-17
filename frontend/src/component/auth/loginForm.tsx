// component/auth/loginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { Input } from '../ui/input'; // Assicurati che il percorso sia corretto
import { Button } from '../ui/button'; // Assicurati che il percorso sia corretto
import Link from 'next/link';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userData = await api.login({ email, password });
      login(userData);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-black">Accedi</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-gray-700">Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="text-gray-400"/>
        </div>
        <div>
          <label htmlFor="password" className="text-gray-700">Password</label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="text-gray-400"/>
        </div>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Accesso in corso...' : 'Accedi'}
        </Button>
      </form>
      <p className="text-sm text-center text-black">
        Non hai un account?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  );
};