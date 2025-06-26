// 'use client'; // Se ha interazioni client-side dirette non gestite dal padre

import { Notific } from '@/types'; // Usa il tipo reale
import { Notifica } from './NotificationPage'; // Adatta il percorso
import { NotificationItem } from './NotificationItem'; // Adatta il percorso

interface NotificationListProps {
  notifications: Notific[];
  onMarkAsRead: (id: number) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, onMarkAsRead }) => {
  if (notifications.length === 0) {
    return <div className="text-center py-10"><p className="text-gray-500">Non ci sono notifiche.</p></div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
};