'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific, User, Group, ExpenseWithParticipants } from '@/types';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

interface ExpenseNotificationItemProps {
  notification: Notific;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2"></div>
    </div>
);

export default function ExpenseNotificationItem({ notification }: ExpenseNotificationItemProps) {
  const { user: currentUser } = useAuth();
  
  // Usiamo una query che dipende dagli ID nella notifica
  const { data, isLoading } = useQuery({
    queryKey: ['notification-details', notification.id],
    queryFn: async () => {
      // Recupera tutti i dati necessari in parallelo
      const [expenseData, group, actor] = await Promise.all([
        // Non abbiamo un'API per una singola spesa, quindi recuperiamo tutte quelle del gruppo
        api.getGroupExpenses(notification.group_id!),
        api.getGroupById(notification.group_id!),
        api.getUserDetails(notification.user_id!),
      ]);

      // Troviamo la spesa specifica che ci interessa
      const relevantExpenseItem = expenseData.find(([exp]) => exp.id === notification.expense_id);
      
      return { expenseItem: relevantExpenseItem, group, actor };
    },
    // Esegui la query solo se gli ID necessari sono presenti
    enabled: !!notification.group_id && !!notification.expense_id && !!notification.notified_user_id && !!currentUser,
  });

  const getFinancialStatus = () => {
    if (!data || !data.expenseItem || !currentUser) {
      return null;
    }
    const [expense, participants] = data.expenseItem;
    const myParticipation = participants.find(p => p.user_id === currentUser.id);

    if (expense.paid_by === currentUser.id) {
      const myShare = myParticipation?.amount_due || 0;
      const amountOwedToMe = expense.total_amount - myShare;
      if (amountOwedToMe > 0.01) {
        return <p className="font-semibold text-green-600">Ti devono essere restituiti {amountOwedToMe.toFixed(2)} €</p>;
      }
    } else if (myParticipation) {
      const amountIOwe = myParticipation.amount_due || 0;
      if (amountIOwe > 0.01) {
        return <p className="font-semibold text-red-600">Devi dare {amountIOwe.toFixed(2)} €</p>;
      }
    }
    return null;
  }

  return (
    <Link href={`/groups/${notification.group_id}`} className="block">
        {isLoading || !data ? (
            <LoadingSkeleton />
        ) : (
            <div>
                <p className="text-sm text-gray-800">
                    <strong className="font-semibold">{data.actor.username}</strong> ha aggiunto la spesa 
                    <strong className="font-semibold"> "{data.expenseItem?.[0].desc}"</strong> nel gruppo 
                    <strong className="font-semibold"> "{data.group.group_name}"</strong>.
                </p>
                <div className="mt-1 text-sm">
                    {getFinancialStatus()}
                </div>
            </div>
        )}
    </Link>
  );
}