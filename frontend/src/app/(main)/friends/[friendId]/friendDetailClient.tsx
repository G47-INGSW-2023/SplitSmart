'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { Button } from '@/component/ui/button';
import { ExpenseWithParticipants, EnrichedFriend } from '@/types';
import AddFriendExpenseModal from '@/component/friends/addFriendsExpenseModal';

interface FriendDetailClientProps {
  friendId: number;
}

export default function FriendDetailClient({ friendId }: FriendDetailClientProps) {
  const { user: currentUser } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // Query per recuperare tutti i dati necessari per questa pagina
  const { data, isLoading } = useQuery({
    queryKey: ['friend-details', friendId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const [friendInfo, privateExpenses] = await Promise.all([
        api.getUserDetails(friendId),
        api.getPrivateExpenses()
      ]);

      const friendDetails: EnrichedFriend = {
        id: friendId, 
        username: friendInfo.username,
        email: friendInfo.email,
      };

      // Filtra le spese per includere solo quelle tra te e questo amico
      const relevantExpenses = privateExpenses.filter(([, participants]) => 
        participants.length === 2 &&
        participants.some(p => p.user_id === currentUser.id) &&
        participants.some(p => p.user_id === friendId)
      );

      // Calcola il saldo netto tra te e questo amico
      let netBalance = 0;
      for (const [expense] of relevantExpenses) {
        if (expense.paid_by === currentUser.id) {
          netBalance += expense.total_amount / 2;
        } else if (expense.paid_by === friendId) {
          netBalance -= expense.total_amount / 2;
        }
      }
      
      return { friend: friendDetails, expenses: relevantExpenses, balance: netBalance };
    },
    enabled: !!currentUser && !isNaN(friendId),
  });

  if (isLoading) return <div>Caricamento...</div>;
  if (!data) return <div>Dati non trovati.</div>;

  const { friend, expenses, balance } = data;
  const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Riepilogo con {friend.username}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg text-gray-600">Saldo Totale</p>
        <p className={`text-4xl font-bold mt-2 ${balanceColor}`}>
          {balance > 0 ? `${friend.username} ti deve ` : balance < 0 ? `Tu devi a ${friend.username} ` : 'Siete in pari'}
          {Math.abs(balance).toFixed(2)} €
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Cronologia Spese</h2>
        <Button onClick={() => setAddModalOpen(true)}>Aggiungi Spesa</Button>
      </div>

      <ul className="space-y-3">
        {expenses.map(([expense]) => (
          <li key={expense.id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p>{expense.desc}</p>
                <p className="text-sm text-gray-500">
                  Pagato da: {expense.paid_by === currentUser?.id ? 'Te' : friend.username}
                </p>
              </div>
              <p className="font-semibold">{expense.total_amount.toFixed(2)} €</p>
            </div>
          </li>
        ))}
      </ul>
      
      <AddFriendExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        friend={friend}
      />
    </div>
  );
}