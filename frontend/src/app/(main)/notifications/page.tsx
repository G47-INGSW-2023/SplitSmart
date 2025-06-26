'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/component/ui/button';
import { GroupInvite, Notific, StatoInvito } from '@/types';
import { NotificationList } from '@/component/notifications/NotificationList';
import { Notifica, TipoNotifica } from '@/component/notifications/NotificationPage';

function transformGroupInvite(invite: GroupInvite): Notifica {
  const statusMap = {
    "PENDING": StatoInvito.PENDENTE,
    "ACCEPTED": StatoInvito.ACCETTATO,
    "REJECTED": StatoInvito.RIFIUTATO,
  };
  return {
    idNotifica: invite.id,
    tipo: TipoNotifica.INVITO_GRUPPO,
    messaggio: `Hai ricevuto un invito per unirti al gruppo ID ${invite.group_id}.`, // Migliorabile se avessimo i nomi
    timestamp: invite.invite_date,
    letta: invite.invite_status !== 'PENDING',
    idInvito: invite.id,
    statoInvito: statusMap[invite.invite_status!] || StatoInvito.PENDENTE,
  };
}

// Funzione helper per trasformare una notifica API in una notifica UI
function transformApiNotification(notif: Notific): Notifica {
  return {
    idNotifica: notif.id,
    tipo: TipoNotifica.GENERALE, // Per ora, tutte le altre sono generiche
    messaggio: notif.message,
    timestamp: notif.creation_date,
    letta: notif.read,
  };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: allNotifications, isLoading } = useQuery<Notifica[]>({
    queryKey: ['all-notifications'],
    queryFn: async () => {
      const [apiNotifications, groupInvites] = await Promise.all([
        api.getNotifications(),
        api.getInvites(),
      ]);

      const transformedNotifications = apiNotifications.map(transformApiNotification);
      const transformedInvites = groupInvites.map(transformGroupInvite);

      // Unisci e ordina
      return [...transformedNotifications, ...transformedInvites]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

   const acceptGroupInviteMutation = useMutation({
    mutationFn: (inviteId: number) => api.acceptInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['groups-with-balances'] }); // Invalida anche i gruppi!
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

    const rejectGroupInviteMutation = useMutation({
    mutationFn: (inviteId: number) => api.rejectInvite(inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  // Mutazione per segnare come letta
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.markNotificationAsRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  const handleAcceptInvite = (inviteId: number) => {
    acceptGroupInviteMutation.mutate(inviteId);
  };
  
  const handleDeclineInvite = (inviteId: number) => {
    rejectGroupInviteMutation.mutate(inviteId);
  };
  
  const unreadCount = allNotifications?.filter(n => !n.letta).length || 0;

  if (isLoading) return <div>Caricamento notifiche...</div>;

   if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Notifiche</h1>
        <p className="text-center py-10 text-gray-500">Caricamento notifiche...</p>
      </div>
    );
  }

 return (
    <div className="space-y-8 ...">
      {/* ... (Intestazione) ... */}
      
      <NotificationList 
        notifications={allNotifications || []}
        onMarkAsRead={handleMarkAsRead}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
      />
    </div>
  );
}