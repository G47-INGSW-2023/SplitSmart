'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GroupCard } from './groupCard';
import { useAuth } from '@/lib/authContext';
import { Group } from '@/types';

const LoadingSkeleton = () => (
  <div>
    <div className="mb-8 p-6 rounded-lg bg-white shadow-lg animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-3"></div>
      <div className="h-10 bg-gray-300 rounded w-1/3 mx-auto"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mt-2"></div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg bg-white shadow-sm animate-pulse h-48">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="mt-auto p-6 pt-4 border-t">
             <div className="h-7 bg-gray-300 rounded w-1/3 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

type GroupWithBalance = Group & { totalBalance: number };

export function GroupList() {
  const { user: currentUser } = useAuth();
  const { data: groupsWithBalances, isLoading, isError, error } = useQuery({
    queryKey: ['groups-with-balances', currentUser?.id],
    queryFn: async (): Promise<GroupWithBalance[]> => {
      if (!currentUser) return [];

      const groups = await api.getGroups();
      
      const processedGroups = await Promise.all(
        groups.map(async (group) => {
          const expensesWithParticipants = await api.getGroupExpenses(group.id);
          
          let groupBalance = 0;
          for (const [expense, participants] of expensesWithParticipants) {
            const myParticipation = participants.find(p => p.user_id === currentUser.id);
            
            if (expense.paid_by === currentUser.id) {
              const myShare = myParticipation?.amount_due || 0;
              groupBalance += (expense.total_amount - myShare);
            } else if (myParticipation) {
              groupBalance -= (myParticipation.amount_due || 0);
            }
          }
          
          return { ...group, totalBalance: groupBalance };
        })
      );
      return processedGroups;
    },
    enabled: !!currentUser,
  });
  
  const overallBalance = groupsWithBalances?.reduce((sum, g) => sum + g.totalBalance, 0) || 0;

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <div className="text-red-500 bg-red-100 p-4 rounded-lg">Errore nel caricamento dei gruppi: {error.message}</div>;

  return (
    <div>
      <div className='flex items-center pb-3'>
        <p className="text-md sm:text-lg text-gray-600">
          {overallBalance > 0.01 ? "In totale devi ricevere" : overallBalance < -0.01 ? "In totale devi dare" : "Sei in pari con tutti."}
        </p>
        {overallBalance != 0 && (
          <p className={`text-lg sm:text-3xl font-bold px-2 ${overallBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallBalance.toFixed(2)}€
          </p>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">I tuoi Gruppi</h2>    
        {groupsWithBalances && groupsWithBalances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupsWithBalances.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Non fai ancora parte di nessun gruppo.</p>
          <p className="text-gray-500 mt-1">Creane uno per iniziare a condividere le spese!</p>
        </div>
      )}
    </div>
  );
}