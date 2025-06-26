// 'use client'; // Se ha interazioni client-side dirette non gestite dal padre

import { Notific } from '@/types'; // Usa il tipo reale
import { Notifica } from './NotificationPage'; // Adatta il percorso
import { NotificationItem } from './NotificationItem'; // Adatta il percorso

interface NotificationListProps {
  notifications: Notifica[]; // 2. La lista deve essere del tipo di UI `Notifica`
  // 3. Le funzioni devono accettare i tipi corretti che `NotificationItem` si aspetta
  onMarkAsRead: (id: number) => void;
  onAcceptInvite: (id: number, inviteId?: number) => void;
  onDeclineInvite: (id: number, inviteId?: number) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ 
  notifications, 
  onMarkAsRead,
  onAcceptInvite,
  onDeclineInvite
}) => {
  if (notifications.length === 0) {
    return <div className="text-center py-10"><p className="text-gray-500">Non ci sono notifiche.</p></div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {notifications.map((notification) => (
        // 4. Passiamo tutte le props necessarie a NotificationItem
        <NotificationItem
          key={notification.idNotifica} // Ora `notification.id` è una stringa unica (es. "notif-1" o "invite-123")
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onAcceptInvite={onAcceptInvite}
          onDeclineInvite={onDeclineInvite}
        />
      ))}
    </div>
  );
};