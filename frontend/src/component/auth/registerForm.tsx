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
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-md m-4 sm:m-0">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Crea un Account</h1>
        <p className="text-gray-500 mt-2">Unisciti a noi per gestire le tue spese.</p>
      </div>
      {success ? (
        <div className="text-center p-4">
          <p className="text-green-600 font-semibold">{success}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
          <div className='space-y-1'>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
            <Input id="name" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} autoComplete="name" className="text-gray-400"/>
          </div>
          <div className='space-y-1'>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" className="text-gray-400"/>
          </div>
          <div className='space-y-1'>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} autoComplete="new-password" className="text-gray-400"/>
          </div>
          <div className='space-y-1'>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Conferma Password</label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} autoComplete="new-password" className="text-gray-400"/>
          </div>

          {error && <p className="text-sm text-center text-red-600 font-medium pt-2">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full !mt-6">
            {isLoading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
        </form>
      )}

      <p className="text-sm text-center text-gray-600">
        Hai già un account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
};