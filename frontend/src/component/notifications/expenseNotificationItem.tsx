'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific, User, Group, ExpenseWithParticipants } from '@/types';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 

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
  const router = useRouter(); 
  const { user: currentUser } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['contextual-notification-details', notification.id],
    queryFn: async () => {
      // Chiamate API di base per gruppo e attore
      const groupPromise = api.getGroupById(notification.group_id!);
      const actorPromise = api.getUserDetails(notification.user_id!);
      
      let expensePromise: Promise<ExpenseWithParticipants[]> | null = null;
      // Se è una notifica di NUOVA SPESA, prepariamo anche la chiamata per le spese
      if (notification.notification_type === 'NEW_EXPENSE' || notification.notification_type === 'EXPENSE_MODIFIED') {
        expensePromise = api.getGroupExpenses(notification.group_id!);
      }

      // Eseguiamo le chiamate necessarie
      const [group, actor, expensesData] = await Promise.all([
        groupPromise, 
        actorPromise,
        expensePromise // Sarà `null` se non è una nuova spesa
      ]);

      let relevantExpenseItem = null;
      if (expensesData) {
        relevantExpenseItem = expensesData.find(([exp]) => exp.id === notification.expense_id);
      }
      
      return { group, actor, expenseItem: relevantExpenseItem };
    },
    enabled: !!notification.group_id && !!notification.user_id && !!currentUser,
  });

  const handleNotificationClick = () => {
    const groupUrl = `/groups/${notification.group_id}`;
    if (notification.expense_id && (notification.notification_type === 'NEW_EXPENSE' || notification.notification_type === 'EXPENSE_MODIFIED')) {
      router.push(`${groupUrl}?openExpense=${notification.expense_id}`);
    } else {
      router.push(groupUrl);
    }
  };

  // Funzione per generare il messaggio principale
  const renderMessage = () => {
    if (!data) return null;
    const { group, actor, expenseItem } = data;

    let actionText = '';
    let expenseName = '';

    switch (notification.notification_type) {
      case 'NEW_EXPENSE':
        actionText = 'ha aggiunto la spesa';
        expenseName = expenseItem?.[0].desc || `ID ${notification.expense_id}`;
        break;
      case 'EXPENSE_MODIFIED':
        actionText = 'ha modificato la spesa';
        expenseName = expenseItem?.[0].desc || `ID ${notification.expense_id}`;
        break;
      case 'EXPENSE_DELETED':
        actionText = 'ha cancellato una spesa';
        break;
      default:
        return <p>{notification.message}</p>; // Fallback
    }

    return (
      <p className="text-sm text-gray-800">
        <strong className="font-semibold">{actor.username}</strong>
        {` ${actionText} `}
        {expenseName && <strong className="font-semibold">"{expenseName}"</strong>}
        {` nel gruppo `}
        <strong className="font-semibold">"{group.group_name}"</strong>.
      </p>
    );
  };
  
  // Funzione per generare lo stato finanziario (solo per NEW_EXPENSE)
  const renderFinancialStatus = () => {
    if (notification.notification_type !== 'NEW_EXPENSE' || !data || !data.expenseItem || !currentUser) {
      return null;
    }
    const [expense, participants] = data.expenseItem;
    const myParticipation = participants.find(p => p.user_id === currentUser.id);

    if (expense.paid_by === currentUser.id) {
      const amount = expense.total_amount - (myParticipation?.amount_due || 0);
      if (amount > 0.01) return <p className="font-semibold text-green-600">Ti devono essere restituiti {amount.toFixed(2)} €</p>;
    } else if (myParticipation) {
      const amount = myParticipation.amount_due || 0;
      if (amount > 0.01) return <p className="font-semibold text-red-600">Devi dare {amount.toFixed(2)} €</p>;
    }
    return null;
  }

  return (
    <div onClick={handleNotificationClick} className="block cursor-pointer">
      {isLoading ? <LoadingSkeleton /> : (
        <div>
          {renderMessage()}
          <div className="mt-1 text-sm">
            {renderFinancialStatus()}
          </div>
        </div>
      )}
    </div>
  );
}