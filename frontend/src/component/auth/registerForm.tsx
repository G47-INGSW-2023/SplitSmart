'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export const RegisterForm = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validazione front-end base
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    setIsLoading(true);
    try {
      await api.register(nome, email, password);
      setSuccess('Registrazione avvenuta con successo! Verrai reindirizzato al login...');
      
      // Reindirizza al login dopo un breve ritardo per far leggere il messaggio
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
      <h1 className="text-2xl font-bold text-center text-gray-800">Crea un Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
            Nome
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Mario Rossi"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            disabled={isLoading || !!success}
            className="text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="tuamail@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || !!success}
            className="text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Minimo 8 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || !!success}
            className="text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700">
            Conferma Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading || !!success}
            className="text-gray-400"
          />
        </div>
        
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        {success && <p className="text-sm text-center text-green-500">{success}</p>}
        
        <Button type="submit" disabled={isLoading || !!success}>
          {isLoading ? 'Registrazione in corso...' : 'Registrati'}
        </Button>
      </form>
      <p className="text-sm text-center text-gray-600">
        Hai già un account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
};