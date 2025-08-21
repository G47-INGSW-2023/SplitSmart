'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { EnrichedFriend } from '@/types';
import Link from 'next/link';

interface FriendWithBalance extends EnrichedFriend {
  totalBalance: number;
}

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);


export default function FriendsListTab() {
  const { user: currentUser } = useAuth();
  // const queryClient = useQueryClient();
  
   const { data: friendsWithBalances, isLoading } = useQuery<FriendWithBalance[]>({
    queryKey: ['friends-with-balances', currentUser?.id],
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

      // 2. Calcola i saldi per ogni amico
      const friendsWithBalancesPromises = friends.map(async (friend) => {
        let totalBalance = 0;

        // a) Calcola saldo da spese private
        const relevantPrivateExpenses = privateExpenses.filter(([, p]) => p.length === 2 && p.some(u => u.user_id === friend.id));
        for (const [expense, participants] of relevantPrivateExpenses) {
          const myShare = participants.find(p => p.user_id === currentUser.id)?.amount_due || 0;
          if (expense.paid_by === currentUser.id) totalBalance += myShare;
          else totalBalance -= myShare;
        }

        // b) Calcola saldo dai gruppi in comune
        for (const group of myGroups) {
          const [groupMembers, groupExpenses] = await Promise.all([
            api.getGroupMembers(group.id),
            api.getGroupExpenses(group.id),
          ]);

          if (!groupMembers.some(m => m.user_id === friend.id)) continue;

          let balanceInGroup = 0;
          for (const [expense, participants] of groupExpenses) {
            const myParticipation = participants.find(p => p.user_id === currentUser.id);
            const friendParticipation = participants.find(p => p.user_id === friend.id);

            if (expense.paid_by === currentUser.id) balanceInGroup += friendParticipation?.amount_due || 0;
            else if (expense.paid_by === friend.id) balanceInGroup -= myParticipation?.amount_due || 0;
          }
          totalBalance += balanceInGroup;
        }
        
        return { ...friend, totalBalance };
      });
      
      return Promise.all(friendsWithBalancesPromises);
    },
    enabled: !!currentUser,
  });
  
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {friendsWithBalances && friendsWithBalances.length > 0 ? (
        <ul>
          {friendsWithBalances
            .filter(f => Math.abs(f.totalBalance) > 0.01) // Mostra solo amici con un saldo
            .sort((a, b) => b.totalBalance - a.totalBalance) // Ordina per chi ti deve di più
            .map(friend => {
              const balance = friend.totalBalance;
              const balanceColor = balance > 0 ? 'text-green-600' : 'text-red-600';
              return (
                <li key={friend.id}>
                  <Link
                    href={`/friends/${friend.id}`}
                    className="block p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{friend.username}</p>
                        <p className="text-sm text-gray-500">{friend.email}</p>
                      </div>
                      <div className={`text-right ${balanceColor}`}>
                        <p className="text-xs">{balance > 0 ? 'Ti deve' : 'Gli devi'}</p>
                        <p className="font-semibold">{Math.abs(balance).toFixed(2)} €</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      ) : (
        <p className="p-10 text-center text-gray-500">Nessun saldo aperto con i tuoi amici.</p>
      )}
    </div>
  );
}