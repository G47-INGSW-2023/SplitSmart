'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EnrichedFriendInvite } from '@/types';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse flex justify-between items-center">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-300 rounded-md"></div>
          <div className="h-9 w-20 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function FriendRequestsTab() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth(); 

  const { data: invites, isLoading } = useQuery<EnrichedFriendInvite[]>({
    queryKey: ['friend-invites-enriched', currentUser?.id], // Usiamo una chiave diversa per i dati arricchiti
    queryFn: async () => {
      const baseInvites = await api.getFriendInvites();
      // Filtra solo gli inviti in sospeso
      const pendingInvites = baseInvites.filter(i => i.invite_status === 'PENDING');
      
        const enrichedPromises = pendingInvites.map(async invite => {
        try {
          const userDetails = await api.getUserDetails(invite.inviting_user_id);
          return { ...invite, inviting_user_name: userDetails.username };
        } catch (error) {
          console.error(`Impossibile recuperare i dettagli per l'invitante ID ${invite.inviting_user_id}`, error);
          return { ...invite, inviting_user_name: 'Utente Sconosciuto' };
        }
      });

      return Promise.all(enrichedPromises);
    },
    enabled: !!currentUser, // Assicurati che la query parta solo quando l'utente è loggato
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
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {invites && invites.length > 0 ? (
        <ul className="space-y-3">
          {invites.map(invite => {
            const isLoadingAction = (acceptMutation.isPending && acceptMutation.variables === invite.id) ||
                                    (rejectMutation.isPending && rejectMutation.variables === invite.id);

            return (
              <li key={invite.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-gray-800">
                  <strong className="font-semibold">{invite.inviting_user_name}</strong> ti ha inviato una richiesta di amicizia.
                </p>
                <div className="flex-shrink-0 flex self-end sm:self-center gap-2">
                  <Button 
                    onClick={() => acceptMutation.mutate(invite.id)}
                    disabled={isLoadingAction}
                  >
                    {acceptMutation.isPending && acceptMutation.variables === invite.id ? '...' : 'Accetta'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => rejectMutation.mutate(invite.id)}
                    disabled={isLoadingAction}
                  >
                    {rejectMutation.isPending && rejectMutation.variables === invite.id ? '...' : 'Rifiuta'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-6">Nessuna richiesta di amicizia in sospeso.</p>
      )}
    </div>
  );
}