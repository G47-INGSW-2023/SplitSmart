'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific, Group } from '@/types';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation'; 

interface NotificationItemProps {
  notification: Notific;
  onMarkAsRead: (id: number) => void;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter(); 
  const { user: currentUser } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['contextual-notification-details', notification.id],
    queryFn: async () => {
      if (!notification.user_id) return null;
      const actorPromise = api.getUserDetails(notification.user_id!);
      let groupPromise: Promise<Group | null> = Promise.resolve(null);

      if (notification.group_id) {
        groupPromise = api.getGroupById(notification.group_id);

      }
      
      const [actor, group] = await Promise.all([actorPromise, groupPromise]);
      

      return { actor, group };
    },
    enabled: !!currentUser,
  });


   const handleNotificationClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    // Navigazione intelligente
    if (notification.group_id) {
      let url = `/groups/${notification.group_id}`;
      if (notification.expense_id && ['NEW_EXPENSE', 'EXPENSE_UPDATED'].includes(notification.notification_type || '')) {
        url += `?openExpense=${notification.expense_id}`;
      }
      router.push(url);
    } else if (notification.user_id && ['NEW_EXPENSE', 'EXPENSE_UPDATED', 'EXPENSE_DELETED'].includes(notification.notification_type || '')) {
      // Spesa privata: linka al profilo dell'amico
      router.push(`/friends/${notification.user_id}`);
    }
    // Aggiungi 
  };

  
  
  const renderContent = () => {
    if (isLoading || !data) {
      return <LoadingSkeleton />;
    }
    const { actor, group } = data;

    // Costruisci il messaggio
    let message: React.ReactNode;
    switch (notification.notification_type) {
      case 'NEW_EXPENSE':
        if (group) { // Spesa di gruppo
          message = <p><strong>{actor.username}</strong> ha aggiunto una spesa nel gruppo <strong>{group.group_name}</strong>.</p>;
        } else { // Spesa privata
          message = <p><strong>{actor.username}</strong> ha aggiunto una spesa privata.</p>;
        }
        break;
      case 'EXPENSE_UPDATED':
        if (group) { // Spesa di gruppo
          message = <p><strong>{actor.username}</strong> ha modificato una spesa nel gruppo <strong>{group?.group_name}</strong>.</p>;
        } else { // Spesa privata
          message = <p><strong>{actor.username}</strong> ha modificato una spesa privata.</p>;
        }

        break;
      case 'EXPENSE_DELETED':
        if (group) { // Spesa di gruppo
          message = <p><strong>{actor.username}</strong> ha cancellato una spesa nel gruppo <strong>{group?.group_name}</strong>.</p>;
        } else { // Spesa privata
          message = <p><strong>{actor.username}</strong> ha cancellato una spesa privata.</p>;
        }
        break;
      case 'FRIENDSHIP_REQUEST_ACCEPTED':
        message = <p><strong>{actor.username}</strong> ha accettato la richiesta di amicizia.</p>;
        break;
      case 'FRIENDSHIP_REQUEST_DENIED':
        message = <p><strong>{actor.username}</strong> ha rifiutato la richiesta di amicizia.</p>;
        break;

      default:
        message = <p>{notification.message || 'Nuova notifica.'}</p>; // Fallback
    }

     return (
      <div>
        <div className="text-sm text-gray-800 break-words">{message}</div>
      </div>
    );
  };
  
  return (
    <div onClick={handleNotificationClick} className="block cursor-pointer">
      {renderContent()}
    </div>
  );
};