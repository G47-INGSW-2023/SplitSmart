'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EnrichedFriendInvite } from '@/types';
import { Button } from '@/component/ui/button';

export default function FriendRequestsTab() {
  const queryClient = useQueryClient();

  const { data: invites, isLoading } = useQuery<EnrichedFriendInvite[]>({
    queryKey: ['friend-invites-enriched'], // Usiamo una chiave diversa per i dati arricchiti
    queryFn: async () => {
      const baseInvites = await api.getFriendInvites();
      // Filtra solo gli inviti in sospeso
      const pendingInvites = baseInvites.filter(i => i.invite_status === 'PENDING');
      
      return Promise.all(
        pendingInvites.map(async invite => {
          const userDetails = await api.getUserDetails(invite.inviting_user_id);
          return { ...invite, inviting_user_name: userDetails.username };
        })
      );
    }
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => api.acceptFriendInvite(id),
    onSuccess: () => {
      // Invalida sia gli inviti che la lista amici
      queryClient.invalidateQueries({ queryKey: ['friend-invites-enriched'] });
      queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.rejectFriendInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-invites-enriched'] });
    }
  });

  const isLoadingAction = acceptMutation.isPending || rejectMutation.isPending;

  // --- ISTRUZIONE `return` MANCANTE AGGIUNTA QUI ---
  if (isLoading) {
    return <p className="text-center text-gray-500">Caricamento richieste...</p>;
  }
  
  return (
    <div className="space-y-4">
      {invites && invites.length > 0 ? (
        <ul className="space-y-3">
          {invites.map(invite => (
            <li key={invite.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-gray-800">
                <strong className="font-semibold">{invite.inviting_user_name}</strong> ti ha inviato una richiesta di amicizia.
              </p>
              <div className="flex-shrink-0 flex gap-2">
                <Button 
                  onClick={() => acceptMutation.mutate(invite.id)}
                  disabled={isLoadingAction}
                >
                  Accetta
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => rejectMutation.mutate(invite.id)}
                  disabled={isLoadingAction}
                >
                  Rifiuta
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-6">Nessuna richiesta di amicizia in sospeso.</p>
      )}
    </div>
  );
}