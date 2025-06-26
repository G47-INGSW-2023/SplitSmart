'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GroupInvite } from '@/types';
import { Button } from '@/component/ui/button';

export default function InvitesTab() {
  const queryClient = useQueryClient();

  const { data: invites, isLoading } = useQuery<GroupInvite[]>({
    queryKey: ['group-invites'],
    queryFn: api.getInvites,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => api.acceptInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups-with-balances'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.rejectInvite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-invites'] }),
  });

  if (isLoading) return <p>Caricamento inviti...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {invites && invites.length > 0 ? (
        invites.map(invite => (
          <div key={invite.id} className="p-4 border-b">
            <p className="text-sm text-gray-800">
              Hai un invito per il gruppo <strong>ID {invite.group_id}</strong> dall'utente <strong>ID {invite.inviting_user_id}</strong>.
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(invite.invite_date).toLocaleString('it-IT')}</p>
            
            {invite.invite_status === 'PENDING' && (
              <div className="mt-3 flex space-x-2">
                <Button onClick={() => acceptMutation.mutate(invite.id)} disabled={acceptMutation.isPending}>Accetta</Button>
                <Button variant="secondary" onClick={() => rejectMutation.mutate(invite.id)} disabled={rejectMutation.isPending}>Rifiuta</Button>
              </div>
            )}
            {invite.invite_status === 'ACCEPTED' && <p className="mt-2 text-xs font-semibold text-green-600">Accettato</p>}
            {invite.invite_status === 'REJECTED' && <p className="mt-2 text-xs font-semibold text-red-600">Rifiutato</p>}
          </div>
        ))
      ) : (
        <p className="p-10 text-center text-gray-500">Nessun invito.</p>
      )}
    </div>
  );
}