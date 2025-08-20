'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';

export default function AddFriendTab() {
  const [email, setEmail] = useState('');
  // const queryClient = useQueryClient();
  
  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteFriend({ email }),
    onSuccess: () => {
      alert("Richiesta di amicizia inviata!");
      setEmail('');
      // Potrebbe essere utile invalidare le richieste inviate, se avessimo una vista per quelle
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate(email);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@esempio.com" required className="text-gray-400" />
      <Button type="submit" disabled={inviteMutation.isPending}>
        {inviteMutation.isPending ? 'Invio...' : 'Invia Richiesta'}
      </Button>
    </form>
  );
}