'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import { formatNotificationMessage } from '@/lib/utils';
import { Button } from '@/component/ui/button';

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
      {notifications && notifications.length > 0 ? (
        notifications.map(notif => (
          <div key={notif.id} className={`p-4 border-b ${!notif.read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="flex-grow">
                <p className="text-sm text-gray-700">{formatNotificationMessage(notif)}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(notif.creation_date).toLocaleString('it-IT')}</p>
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