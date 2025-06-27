'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import { formatNotificationMessage } from '@/lib/utils';
import { Button } from '@/component/ui/button';
import ExpenseNotificationItem from './expenseNotificationItem'; // Importa il nuovo componente
import GenericExpenseNotificationItem from './genericExpenseNotificationItem'; // Importa il nuovo componente

export default function NotificationsTab() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notific[]>({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) return <p>Caricamento notifiche...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
     {notifications?.map(notif => (
          <div key={notif.id} className={`p-4 border-b ${!notif.read ? 'bg-blue-50' : ''} ...`}>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                
                {/* --- DISPATCHER AGGIORNATO --- */}
                {(() => {
                  switch (notif.notification_type) {
                    case 'NEW_EXPENSE':
                      return <ExpenseNotificationItem notification={notif} />;
                    
                    case 'EXPENSE_MODIFIED':
                      // Per "modificata", non conosciamo il nome della spesa, quindi mostriamo un testo generico
                      // In futuro, il backend potrebbe aggiungere `expense_desc` alla notifica
                      return <GenericExpenseNotificationItem 
                                notification={notif} 
                                actionText="ha modificato la spesa"
                                expenseName={`ID ${notif.expense_id}`} // Nome finto
                             />;

                    case 'EXPENSE_DELETED':
                      return <GenericExpenseNotificationItem 
                                notification={notif} 
                                actionText="ha cancellato una spesa" 
                             />;

                    default:
                      // Fallback per tutte le altre
                      return <p className="text-sm">{formatNotificationMessage(notif)}</p>;
                  }
                })()}
                
                <p className="text-xs text-gray-500 mt-2">{new Date(notif.creation_date).toLocaleString('it-IT')}</p>
              </div>
              {!notif.read && (
                <Button onClick={() => markAsReadMutation.mutate(notif.id)}>✓</Button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}