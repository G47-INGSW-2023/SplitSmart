'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EnrichedGroupInvite } from '@/types';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

const LoadingSkeleton = () => (
    <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="flex gap-2 self-end sm:self-center">
                    <div className="h-9 w-20 bg-gray-300 rounded-md"></div>
                    <div className="h-9 w-20 bg-gray-200 rounded-md"></div>
                </div>
            </div>
        ))}
    </div>
);


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

  if (isLoading) return < LoadingSkeleton />;

  return (      
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {enrichedInvites && enrichedInvites.length > 0 ? (
        // Usiamo `<ul>` e `<li>` per una migliore semantica
        <ul className="divide-y divide-gray-200">
          {enrichedInvites.map(invite => (
            <li key={invite.id} className="p-4">
              
              {/* Contenitore principale della riga */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                
                {/* Sezione testo (cresce per occupare spazio) */}
                <div className="flex-grow">
                  <p className="text-sm text-gray-800">
                    <strong className="font-semibold">{invite.inviting_user_name}</strong> ti ha invitato a unirti al gruppo <strong className="font-semibold">{invite.group_name}</strong>.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(invite.invite_date).toLocaleString('it-IT')}</p>
                </div>
                
                {/* Sezione azioni (non si restringe) */}
                <div className="flex-shrink-0 self-end sm:self-center">
                  {invite.invite_status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <Button onClick={() => acceptMutation.mutate(invite.id)} disabled={acceptMutation.isPending}>Accetta</Button>
                      <Button variant="secondary" onClick={() => rejectMutation.mutate(invite.id)} disabled={rejectMutation.isPending}>Rifiuta</Button>
                    </div>
                  )}
                  {invite.invite_status === 'ACCEPTED' && <p className="text-sm font-semibold text-green-600">Accettato</p>}
                  {invite.invite_status === 'REJECTED' && <p className="text-sm font-semibold text-red-600">Rifiutato</p>}
                </div>

              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-10 text-center text-gray-500">Nessun invito ricevuto.</p>
      )}
    </div>
  );
}