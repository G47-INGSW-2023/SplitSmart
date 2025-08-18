'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import { formatNotificationMessage } from '@/lib/utils';
import { Button } from '@/component/ui/button';
import ExpenseNotificationItem from './expenseNotificationItem'; // Importa il nuovo componente
import { useAuth } from '@/lib/authContext';
import { useEffect } from 'react';

export default function NotificationsTab() {
  const queryClient = useQueryClient();
  const { refetchNotifications } = useAuth();

  const { data: notifications, isLoading } = useQuery<Notific[]>({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetchNotifications();
    },
  });

  useEffect(() => {
    if (notifications) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        console.log(`Segno ${unreadNotifications.length} notifiche come lette...`);
        // Esegui la mutazione per ogni notifica non letta
        unreadNotifications.forEach(notif => {
          markAsReadMutation.mutate(notif.id);
        });
      }
    }
  }, [notifications]);

  if (isLoading) return <p>Caricamento notifiche...</p>;

  const notificationTypes = ['NEW_EXPENSE', 'EXPENSE_MODIFIED', 'EXPENSE_DELETED'];

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
     {notifications && notifications.length > 0 ? (
        notifications.map(notif => (
          <div key={notif.id} className={`p-4 border-b ${!notif.read ? 'bg-blue-50' : ''} hover:bg-gray-100 transition-colors`}>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                
                {/* --- DISPATCHER SEMPLIFICATO --- */}
                {notificationTypes.includes(notif.notification_type || '') ? (
                  // Se è una notifica di gruppo, usa il componente intelligente
                  <ExpenseNotificationItem notification={notif} />
                ) : (
                  // Altrimenti, usa la formattazione di base
                  <p className="text-sm text-gray-700">{formatNotificationMessage(notif)}</p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">{new Date(notif.creation_date).toLocaleString('it-IT')}</p>
              </div>
              {!notif.read && (
                <Button onClick={() => markAsReadMutation.mutate(notif.id)}>✓</Button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="p-10 text-center text-gray-500">Nessuna notifica.</p>
      )}
    </div>
  );
}