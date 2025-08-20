'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useState, useMemo } from 'react';
import { EnrichedFriend, ExpenseWithParticipants } from '@/types';
import { Button } from '@/component/ui/button';
import AddPrivateExpenseModal from '@/component/balances/addPrivateExpenseModal';
import Link from 'next/link';

interface FriendBalance {
  friend: EnrichedFriend;
  balance: number;
}

export default function BalancesPage() {
  const { user: currentUser } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // Query per recuperare le spese private
  const { data: privateExpenses, isLoading: isLoadingExpenses } = useQuery<ExpenseWithParticipants[]>({
    queryKey: ['private-expenses', currentUser?.id],
    queryFn: api.getPrivateExpenses,
    enabled: !!currentUser,
  });
  
  const { data: friends, isLoading: isLoadingFriends } = useQuery<EnrichedFriend[]>({
    queryKey: ['friends-list', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const friendships = await api.getFriends();
      const friendIds = friendships.map(f => f.user1 === currentUser.id ? f.user2 : f.user1);
      
      const friendDetailsPromises = friendIds.map(async (id) => {
        const userDetails = await api.getUserDetails(id);
        const friend: EnrichedFriend = {
          id: id,
          username: userDetails.username,
          email: userDetails.email,
        };
        return friend;
      });
      return Promise.all(friendDetailsPromises);
    },
    enabled: !!currentUser,
  });

     const friendBalances = useMemo((): FriendBalance[] => {
    console.log("Eseguo calcolo `useMemo`...");
    if (!privateExpenses || !friends || !currentUser) {
      console.log("Dati mancanti:", { privateExpenses, friends, currentUser });
      return [];
    }
    
    console.log("Dati disponibili per il calcolo:", { privateExpenses, friends });

    const balances = new Map<number, number>();
    for (const [expense, participants] of privateExpenses) {
        const myParticipation = participants.find(p => p.user_id === currentUser.id);
        const myShare = myParticipation?.amount_due || 0;
        if (expense.paid_by === currentUser.id) {
            participants.forEach(p => {
                if (p.user_id !== currentUser.id) balances.set(p.user_id, (balances.get(p.user_id) || 0) + (p.amount_due || 0));
            });
        } else if (myParticipation) {
            balances.set(expense.paid_by, (balances.get(expense.paid_by) || 0) - myShare);
        }
    }
    
    const result = friends
      .map(friend => ({
        friend,
        balance: balances.get(friend.id) || 0,
      }))
      .filter(fb => Math.abs(fb.balance) > 0.01);
      
    console.log("Risultato del calcolo dei saldi:", result);
    return result;
  }, [privateExpenses, friends, currentUser]);

  const isLoading = isLoadingExpenses || isLoadingFriends;
  
   if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-800">Saldi con i Tuoi Amici</h1>
        <p className="text-center text-gray-500 py-6">Caricamento saldi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Saldi con i Tuoi Amici</h1>
        {/* Abbiamo rimosso il pulsante globale, quindi lo commento */}
        <Button onClick={() => setAddModalOpen(true)}>Aggiungi Spesa</Button> 
      </div>

      {friendBalances.length > 0 ? (
        <ul className="space-y-3">
          {friendBalances.map(({ friend, balance }) => (
            <li key={friend.id}>
              <Link
                href={`/friends/${friend.id}`}
                className="block bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{friend.username}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                  <div className={`text-right ${balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="font-semibold">{Math.abs(balance).toFixed(2)} €</p>
                    <p className="text-xs">{balance > 0 ? 'Ti deve' : 'Gli devi'}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-6">Non hai saldi aperti con nessun amico.</p>
      )}

      {/* Rimuovo temporaneamente la chiamata al modale per eliminare l'errore di percorso */}
      { 
      <AddPrivateExpenseModal 
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        friends={friends || []}
      /> 
      }
    </div>
  );
}