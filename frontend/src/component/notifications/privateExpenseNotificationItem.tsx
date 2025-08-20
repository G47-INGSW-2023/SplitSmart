'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import Link from 'next/link';

interface PrivateExpenseNotificationItemProps {
  notification: Notific;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
    </div>
);

export default function PrivateExpenseNotificationItem({ notification }: PrivateExpenseNotificationItemProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['private-notification-details', notification.id],
    queryFn: async () => {
      // Per una spesa privata, l'altro utente è `notified_user_id` e l'attore è `user_id`
      const actor = await api.getUserDetails(notification.user_id!);
      
      // Non c'è bisogno di recuperare i dettagli della spesa perché il messaggio è generico
      
      return { actor };
    },
    enabled: !!notification.user_id,
  });

  if (isLoading || !data) {
    return <LoadingSkeleton />;
  }

  // Costruiamo il link alla pagina di dettaglio dell'amico
  const friendLink = `/friends/${notification.user_id}`;

  return (
    <Link href={friendLink} className="block">
      <p className="text-sm text-gray-800">
        Hai una nuova spesa con <strong className="font-semibold">{data.actor.username}</strong>.
      </p>
      {/* Per ora non mostriamo il saldo qui, perché richiederebbe calcoli complessi */}
    </Link>
  );
}