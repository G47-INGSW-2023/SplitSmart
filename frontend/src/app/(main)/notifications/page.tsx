'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/component/ui/button'; 
import { Notifica, StatoInvito, TipoNotifica } from '@/component/notifications/NotificationPage'; 
import { NotificationList } from '@/component/notifications/NotificationList'; 
import { GroupInvite } from '@/types';


function transformInviteToNotification(invite: GroupInvite): Notifica {
  return {
    idNotifica: `invite-${invite.id}`,
    tipo: TipoNotifica.INVITO_GRUPPO,
    messaggio: `Hai ricevuto un invito per unirti al gruppo ID ${invite.group_id} dall'utente ID ${invite.inviting_user_id}.`,
    timestamp: invite.invite_date,
    letta: invite.invite_status !== 'PENDING',
    idInvito: invite.id.toString(), 
    nomeGruppo: `Gruppo ${invite.group_id}`,
    statoInvito: invite.invite_status === 'ACCEPTED' ? StatoInvito.ACCETTATO : 
                 invite.invite_status === 'REJECTED' ? StatoInvito.RIFIUTATO : StatoInvito.PENDENTE,
  };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: invites, isLoading, isError } = useQuery<GroupInvite[]>({
    queryKey: ['invites'],
    queryFn: api.getInvites,
  });

  const inviteNotifications = invites?.map(transformInviteToNotification) || [];
  const allNotifications = [...inviteNotifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const acceptMutation = useMutation({
    mutationFn: (inviteId: number) => api.acceptInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const rejectMutation = useMutation({
    mutationFn: (inviteId: number) => api.rejectInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const handleAcceptInvite = (idNotifica: string, idInvito?: string) => {
    if (!idInvito) return;
    acceptMutation.mutate(parseInt(idInvito, 10));
  };

  const handleDeclineInvite = (idNotifica: string, idInvito?: string) => {
    if (!idInvito) return;
    rejectMutation.mutate(parseInt(idInvito, 10));
  };

  const handleMarkAsRead = (id: string) => console.log(`Segna come letta: ${id}`);
  const handleMarkAllAsRead = () => console.log('Segna tutte come lette');

  if (isLoading) {
    return <div>Caricamento notifiche...</div>;
  }
  if (isError) {
    return <div>Errore nel caricamento degli inviti.</div>;
  }

  const unreadCount = allNotifications.filter(n => !n.letta).length;

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Notifiche</h1>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>Segna tutte come lette ({unreadCount})</Button>
        )}
      </div>
      
      <NotificationList 
        notifications={allNotifications}
        onMarkAsRead={handleMarkAsRead}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
      />
    </div>
  );
}