// component/auth/registerForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '../ui/input'; // Assicurati che il percorso sia corretto
import { Button } from '../ui/button'; // Assicurati che il percorso sia corretto
import Link from 'next/link';

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    setIsLoading(true);
    try {
      await api.register({ username, email, password });
      setSuccess('Registrazione avvenuta con successo! Verrai reindirizzato al login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-black">Crea un Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-gray-700">Nome</label>
          <Input id="name" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading || !!success} className="text-gray-400"/>
        </div>
        <div>
          <label htmlFor="email" className="text-gray-700">Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading || !!success} className="text-gray-400"/>
        </div>
        <div>
          <label htmlFor="password" className="text-gray-700">Password</label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading || !!success} className="text-gray-400"/>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-gray-700">Conferma Password</label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading || !!success} className="text-gray-400"/>
        </div>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        {success && <p className="text-sm text-center text-green-500">{success}</p>}
        <Button type="submit" disabled={isLoading || !!success} className="w-full">
          {isLoading ? 'Registrazione in corso...' : 'Registrati'}
        </Button>
      </form>
      <p className="text-sm text-center text-black">
        Hai già un account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
};