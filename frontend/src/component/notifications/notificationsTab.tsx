'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import NotificationItem from './notificationItem'; // Importa il nuovo componente
import { useAuth } from '@/lib/authContext';
import { useEffect, useRef } from 'react';
import { formatNotificationMessage } from '@/lib/utils';

export default function NotificationsTab() {
  const queryClient = useQueryClient();
  const { refetchNotifications } = useAuth();

  const markedAsRead = useRef(false);
  
  const { data: notifications, isLoading } = useQuery<Notific[]>({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
    select: (data) => {
      return data.sort((a, b) => 
        new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
      );  
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetchNotifications();
    },
    onError: (error) => console.error("Errore nel segnare la notifica come letta:", error),
  });

  useEffect(() => {
    if (notifications && !markedAsRead.current && notifications.some(n => !n.read)) {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      unreadNotifications.forEach(notif => {
        markAsReadMutation.mutate(notif.id);
      });

      markedAsRead.current = true;
    }
  }, [notifications, markAsReadMutation]); 

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const contextualTypes = ['NEW_EXPENSE', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'FRIENDSHIP_REQUEST_ACCEPTED', 'FRIENDSHIP_REQUEST_DENIED'];

  if (isLoading) return <p>Caricamento notifiche...</p>;
  return (
        
<div className="bg-white shadow-md rounded-lg overflow-hidden">
  {notifications && notifications.length > 0 ? (
    // 1. Usa <ul> e `divide-y` per una lista semanticamente corretta e ben separata
    <ul className="divide-y divide-gray-200">
      {notifications.map(notif => (
        // La chiave ora è sull'elemento `li`
        <li key={notif.id} className={`p-3 sm:p-4 transition-colors ${!notif.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-start gap-3 sm:gap-4">
            
            {/* Icona (opzionale, ma migliora molto la UI) */}
            {/* <div className="flex-shrink-0 mt-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            </div> */}

            {/* Contenuto principale */}
            <div className="flex-grow">
              
              {/* Il dispatcher rimane lo stesso */}
              {contextualTypes.includes(notif.notification_type || '') ? (
                <NotificationItem notification={notif} onMarkAsRead={handleMarkAsRead} />
              ) : (
                <p className="text-sm text-gray-800">{formatNotificationMessage(notif)}</p>
              )}  
                              
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                {new Date(notif.creation_date).toLocaleString('it-IT', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="p-10 text-center text-gray-500">Nessuna notifica.</p>
  )}
</div>

  
  );
}