'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EnrichedGroupInvite } from '@/types';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

export default function InvitesTab() {
  const queryClient = useQueryClient();
  const { refetchNotifications } = useAuth(); 

  const { data: enrichedInvites, isLoading } = useQuery<EnrichedGroupInvite[]>({
    queryKey: ['group-invites-enriched'], 
    queryFn: async () => {
      const invites = await api.getInvites();
      if (!invites || invites.length === 0) {
        return [];
      }

      const enrichedPromises = invites.map(async (invite) => {
        try {
          const [group, invitingUser] = await Promise.all([
            api.getGroupById(invite.group_id),
            api.getUserDetails(invite.inviting_user_id),
          ]);

          return {
            ...invite, 
            group_name: group.group_name,
            inviting_user_name: invitingUser.username,
          };
        } catch (error) {
          console.error(`Impossibile arricchire l'invito ID ${invite.id}:`, error);
          return {
            ...invite,
            group_name: `Gruppo ID ${invite.group_id}`,
            inviting_user_name: `Utente ID ${invite.inviting_user_id}`,
          };
        }
      });

      return Promise.all(enrichedPromises);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => api.acceptInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups-with-balances'] });
      refetchNotifications();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.rejectInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites-enriched'] });
      refetchNotifications(); 
    },  
  });

  if (isLoading) return <p>Caricamento inviti...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {enrichedInvites && enrichedInvites.length > 0 ? (
        enrichedInvites.map(invite => (
          <div key={invite.id} className="p-4 border-b last:border-b-0">
            <p className="text-sm text-gray-800">
              {/* 4. Mostra i nomi invece degli ID */}
              <strong className="font-semibold">{invite.inviting_user_name}</strong> ti ha invitato a unirti al gruppo <strong className="font-semibold">&quot;{invite.group_name}&quot;</strong>.
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(invite.invite_date).toLocaleString('it-IT')}</p>
            
            {invite.invite_status === 'PENDING' && (
              <div className="mt-3 flex space-x-2">
                <Button onClick={() => acceptMutation.mutate(invite.id)} disabled={acceptMutation.isPending}>Accetta</Button>
                <Button variant="secondary" onClick={() => rejectMutation.mutate(invite.id)} disabled={rejectMutation.isPending}>Rifiuta</Button>
              </div>
            )}
            {invite.invite_status === 'ACCEPTED' && <p className="mt-2 text-xs font-semibold text-green-600">Invito accettato.</p>}
            {invite.invite_status === 'REJECTED' && <p className="mt-2 text-xs font-semibold text-red-600">Invito rifiutato.</p>}
          </div>
        ))
      ) : (
        <p className="p-10 text-center text-gray-500">Nessun invito ricevuto.</p>
      )}
    </div>
  );
}