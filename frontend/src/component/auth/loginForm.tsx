'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Link from 'next/link';
import { api } from '@/lib/api'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export const LoginForm = () => {
  const [email, setEmail] = useState('user@example.com'); // Precompilato per comodità
  const [password, setPassword] = useState('password123'); // Precompilato per comodità
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth(); 
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // La chiamata `api.login` ora restituisce { token: "..." }
      const { token } = await api.login({ email, password });
      
      // Passa il token al context, che si occuperà del resto
      await login(token); 
      
      router.push('/dashboard');
      } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
      } finally {
      setIsLoading(false);
      }
    };


  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">Accedi</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700"> Email </label>
                <Input id="email" type="email" placeholder="tuamail@esempio.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-gray-400"/>
            </div>  
            <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700"> Password </label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="text-gray-400"/>
            </div>
            {error && <p className="text-sm text-center text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading}> {isLoading ? 'Caricamento...' : 'Login'} </Button>
        </form>
        <p className="text-sm text-center text-gray-600">
            Non hai un account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:underline"> Registrati </Link>
        </p>
    </div>
  );
};