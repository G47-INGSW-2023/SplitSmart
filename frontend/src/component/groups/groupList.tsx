'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GroupCard } from './groupCard';
import { useAuth } from '@/lib/authContext';
import { Group } from '@/types';

// Componente per lo stato di caricamento
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg bg-white animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

type GroupWithBalance = Group & { totalBalance: number };

export function GroupList() {
  const { user: currentUser } = useAuth();
  // useQuery gestisce tutto: fetching, caching, loading, errori...
  const { data: groupsWithBalances, isLoading, isError, error } = useQuery({
    // La chiave della query è unica per l'utente, così se l'utente cambia, i dati vengono ricaricati
    queryKey: ['groups-with-balances', currentUser?.id],
    queryFn: async (): Promise<GroupWithBalance[]> => {
      if (!currentUser) return [];

      // 1. Recupera la lista base di tutti i gruppi
      const groups = await api.getGroups();
      
      // 2. Per ogni gruppo, recupera le sue spese e calcola il saldo
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
    // Esegui la query solo se l'utente è loggato
    enabled: !!currentUser,
  });
  
  // Calcoliamo il saldo aggregato su tutti i gruppi (come prima)
  const overallBalance = groupsWithBalances?.reduce((sum, g) => sum + g.totalBalance, 0) || 0;

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <div className="text-red-500">Errore: {error.message}</div>;

  return (
    <div>
       <div className="mb-8 p-6 rounded-lg bg-white shadow-lg text-center">
        <p className="text-lg text-gray-600">Il tuo saldo complessivo</p>
        <p className={`text-4xl font-bold mt-2 ${overallBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {overallBalance >= 0 ? '+' : ''}{overallBalance.toFixed(2)} €
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {overallBalance > 0 ? "In totale, gli altri ti devono soldi." : overallBalance < 0 ? "In totale, tu devi soldi agli altri." : "Sei in pari con tutti."}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">I tuoi Gruppi</h2>
      {groupsWithBalances && groupsWithBalances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Passiamo l'oggetto gruppo "arricchito" alla GroupCard */}
          {groupsWithBalances.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Non fai ancora parte di nessun gruppo.</p>
        </div>
      )}
    </div>
  );
}