'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext'; 

export default function AddFriendTab() {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
    
  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteFriend({ email }),
    onSuccess: () => {
      alert("Richiesta di amicizia inviata!");
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['friend-invites-enriched', currentUser?.id] });
    },
    onError: (error) => {
      if (error.message.includes('utente')) {
        alert("Errore: Impossibile trovare un utente con questa email.");
      } else {
        alert(`Errore: ${error.message}`);
      }
    }, 
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (email.trim().toLowerCase() === currentUser?.email.toLowerCase()) {
      alert("Non puoi inviare una richiesta di amicizia a te stesso.");
      return;
    }
    inviteMutation.mutate(email.trim());
  };
  
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-md text-gray-800 mb-4">Invia richiesta di amicizia</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="email@esempio.com" 
          required 
          disabled={inviteMutation.isPending}
          className="w-full text-gray-700"
        />
        <Button 
          type="submit" 
          disabled={inviteMutation.isPending}
          className="w-full sm:w-auto flex-shrink-0" 
        >
          {inviteMutation.isPending ? 'Invio in corso...' : 'Invia'}
        </Button>
      </form>
    </div>
  );
}