// 'use client'; // Se ha interazioni client-side dirette non gestite dal padre

import { Notifica } from './NotificationPage'; // Adatta il percorso
import { NotificationItem } from './NotificationItem'; // Adatta il percorso

interface NotificationListProps {
  notifications: Notifica[];
  onMarkAsRead: (id: string) => void;
  onAcceptInvite: (idNotifica: string, idInvito?: string, nomeGruppo?: string) => void;
  onDeclineInvite: (idNotifica: string, idInvito?: string, nomeGruppo?: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onAcceptInvite,
  onDeclineInvite,
}) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Non ci sono nuove notifiche.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.idNotifica}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onAcceptInvite={onAcceptInvite}
          onDeclineInvite={onDeclineInvite}
        />
      ))}
    </div>
  );
};