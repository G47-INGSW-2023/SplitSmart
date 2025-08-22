'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific, ExpenseWithParticipants, Group } from '@/types';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation'; 

interface ExpenseNotificationItemProps {
  notification: Notific;
  onMarkAsRead: (id: number) => void;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2"></div>
    </div>
);

export default function ExpenseNotificationItem({ notification, onMarkAsRead }: ExpenseNotificationItemProps) {
  const router = useRouter(); 
  const { user: currentUser } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['contextual-notification-details', notification.id],
    queryFn: async () => {
      if (!notification.user_id) return null;
      const actorPromise = api.getUserDetails(notification.user_id!);
      let groupPromise: Promise<Group | null> = Promise.resolve(null);
      let expensePromise: Promise<ExpenseWithParticipants[] | null> = Promise.resolve(null);

      if (notification.group_id) {
        groupPromise = api.getGroupById(notification.group_id);
        if (notification.notification_type === 'NEW_EXPENSE') {
          expensePromise = api.getGroupExpenses(notification.group_id);
        }
      }
      
      const [actor, group, expensesData] = await Promise.all([actorPromise, groupPromise, expensePromise]);
      
      const relevantExpenseItem = expensesData?.find(([exp]) => exp.id === notification.expense_id) || null;

      return { actor, group, expenseItem: relevantExpenseItem };
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
    const { actor, group, expenseItem } = data;

    // Costruisci il messaggio
    let message: React.ReactNode;
    switch (notification.notification_type) {
      case 'NEW_EXPENSE':
        if (group) { // Spesa di gruppo
          message = <p><strong>{actor.username}</strong> ha aggiunto la spesa <strong>{expenseItem?.[0].desc}</strong> nel gruppo <strong>{group.group_name}</strong>.</p>;
        } else { // Spesa privata
          message = <p>Hai una nuova spesa con <strong>{actor.username}</strong>.</p>;
        }
        break;
      case 'EXPENSE_UPDATED':
        message = <p><strong>{actor.username}</strong> ha modificato una spesa nel gruppo <strong>{group?.group_name}</strong>.</p>;
        break;
      case 'EXPENSE_DELETED':
        message = <p><strong>{actor.username}</strong> ha cancellato una spesa nel gruppo <strong>{group?.group_name}</strong>.</p>;
        break;
      default:
        message = <p>{notification.message || 'Nuova notifica.'}</p>; // Fallback
    }

    // Calcola lo stato finanziario (solo per NEW_EXPENSE di gruppo)
    let financialStatus: React.ReactNode = null;
    if (notification.notification_type === 'NEW_EXPENSE' && group && expenseItem && currentUser) {
      const [expense, participants] = expenseItem;
      const myParticipation = participants.find(p => p.user_id === currentUser.id);
      if (expense.paid_by === currentUser.id) {
        const amount = expense.total_amount - (myParticipation?.amount_due || 0);
        if (amount > 0.01) financialStatus = <p className="font-semibold text-green-600">Ti devono essere restituiti {amount.toFixed(2)} €</p>;
      } else if (myParticipation) {
        const amount = myParticipation.amount_due || 0;
        if (amount > 0.01) financialStatus = <p className="font-semibold text-red-600">Devi dare {amount.toFixed(2)} €</p>;
      }
    }

     return (
      <div>
        <div className="text-sm text-gray-800">{message}</div>
        <div className="mt-1 text-sm">{financialStatus}</div>
      </div>
    );
  };
  
  return (
    <div onClick={handleNotificationClick} className="block cursor-pointer">
      {renderContent()}
    </div>
  );
};