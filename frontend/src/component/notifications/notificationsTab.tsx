'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import ExpenseNotificationItem from './expenseNotificationItem'; // Importa il nuovo componente
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

  const contextualTypes = ['NEW_EXPENSE', 'EXPENSE_UPDATED', 'EXPENSE_DELETED'];

  if (isLoading) return <p>Caricamento notifiche...</p>;
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
     {notifications && notifications.length > 0 ? (
        notifications.map(notif => (
          <div key={notif.id} className={`p-4 border-b last:border-b-0 ${!notif.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                
                {contextualTypes.includes(notif.notification_type || '') ? (
                  // Se è una notifica di spesa (sia di gruppo che privata), usa il componente intelligente
                  <ExpenseNotificationItem notification={notif} onMarkAsRead={handleMarkAsRead} />
                ) : (
                  // Per tutte le altre, usa la formattazione di base
                  <p className="text-sm">{formatNotificationMessage(notif)}</p>
                )}  
                              
                <p className="text-xs text-gray-500 mt-2">{new Date(notif.creation_date).toLocaleString('it-IT')}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="p-10 text-center text-gray-500">Nessuna notifica.</p>
      )}
    </div>
  );
}