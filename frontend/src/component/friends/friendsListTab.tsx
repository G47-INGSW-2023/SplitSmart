'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { EnrichedFriend, ExpenseParticipation, ExpenseWithParticipants } from '@/types';
import Link from 'next/link';

interface FriendWithBalance extends EnrichedFriend {
  totalBalance: number;
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse flex justify-between items-center">
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
    ))}
  </div>
);


export default function FriendsListTab() {
  const { user: currentUser } = useAuth();
  // const queryClient = useQueryClient();
  
  const { data: friendsWithBalances, isLoading } = useQuery<FriendWithBalance[]>({
    queryKey: ['friends-list', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      // 1. Recupera tutti i dati di base in parallelo
      const [friendships, privateExpenses, myGroups] = await Promise.all([
        api.getFriends(),
        api.getPrivateExpenses(),
        api.getGroups(),
      ]);

      const friendIds = friendships.map(f => f.user1 === currentUser.id ? f.user2 : f.user1);
      const friends = await Promise.all(friendIds.map(id => api.getUserDetails(id).then(details => ({ id, ...details }))));

      const groupExpensesMap = new Map<number, ExpenseWithParticipants[]>();
      await Promise.all(myGroups.map(async (group) => {
        const expenses = await api.getGroupExpenses(group.id);
        groupExpensesMap.set(group.id, expenses);
      }));

      const friendsWithBalancesPromises = friends.map(async (friend) => {
        let totalBalance = 0;

        // a) Calcola saldo da spese private (logica semplificata)
        privateExpenses
          .filter(([, p]) => p.length === 2 && p.some(u => u.user_id === friend.id))
          .forEach(([expense, participants]) => {
            const myShare = participants.find((p: ExpenseParticipation) => p.user_id === currentUser.id)?.amount_due || 0;
            totalBalance += (expense.paid_by === currentUser.id ? myShare : -myShare);
          });

        // b) Calcola saldo dai gruppi in comune  
        myGroups.forEach(group => {
          const groupExpenses = groupExpensesMap.get(group.id) || [];
          let balanceInGroup = 0;
          for (const [expense, participants] of groupExpenses) {
            const myParticipation = participants.find((p: ExpenseParticipation) => p.user_id === currentUser.id);
            const friendParticipation = participants.find((p: ExpenseParticipation) => p.user_id === friend.id);

            if (!myParticipation || !friendParticipation) continue;

            if (expense.paid_by === currentUser.id) balanceInGroup += friendParticipation.amount_due || 0;
            else if (expense.paid_by === friend.id) balanceInGroup -= myParticipation.amount_due || 0;
          }
          totalBalance += balanceInGroup;
        });
        
        return { ...friend, totalBalance };
      });
      
      return Promise.all(friendsWithBalancesPromises);
    },
    enabled: !!currentUser,
  });
  
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      {friendsWithBalances && friendsWithBalances.length > 0 ? (
        <ul className="space-y-3">
          {friendsWithBalances
            .sort((a, b) => b.totalBalance - a.totalBalance)
            .map(friend => {
              const balance = friend.totalBalance;
              const balanceColor = balance > 0.01 ? 'text-green-600' : balance < -0.01 ? 'text-red-600': 'text-gray-500';
              const isSettled = Math.abs(balance) < 0.01;

              return (
                <li key={friend.id}>
                  <Link
                    href={`/friends/${friend.id}`}
                    className="block p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    {/* --- LAYOUT RESPONSIVE PER LA RIGA --- */}
                    <div className="flex flex-row justify-between sm:items-center gap-2">
                      {/* Sezione Nome/Email */}
                      <div>
                        <p className="font-medium text-gray-800">{friend.username}</p>
                      </div>
                      {/* Sezione Saldo */}
                      <div className={`text-right ${balanceColor}`}>
                        {isSettled ?(
                          <p className='font-medium'>In pari</p>
                        ): (
                          <>
                            <p className='text-sm'>{balance > 0 ? 'Ti deve' : 'Gli devi'}</p>
                            <p className='font-semibold'>{Math.abs(balance).toFixed(2)} €</p>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      ) : (
        <p className="p-10 text-center text-gray-500">Non hai ancora aggiunto nessun amico.</p>
      )}
    </div>
  );
}