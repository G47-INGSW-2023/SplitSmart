'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { Button } from '@/component/ui/button';
import { ExpenseWithParticipants, EnrichedFriend } from '@/types';
import AddFriendExpenseModal from '@/component/friends/addFriendsExpenseModal';
import PrivateExpenseDetailModal from '../privateExpenseDetailModal';
import EditPrivateExpenseModal from '../editPrivateExpenseModal';
import { TimelineItem } from '@/types'; // Importa il nuovo tipo
import Link from 'next/link';

interface FriendDetailClientProps {
  friendId: number;
}

export default function FriendDetailClient({ friendId }: FriendDetailClientProps) {
  const { user: currentUser } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);  
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParticipants | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithParticipants | null>(null);


  const handleOpenEditModal = (expenseData: ExpenseWithParticipants) => {
    setSelectedExpense(null);
    setEditingExpense(expenseData);
  };
  // Query per recuperare tutti i dati necessari per questa pagina
  const { data, isLoading } = useQuery({
    queryKey: ['friend-details', friendId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      
      const [friendInfo, privateExpenses, myGroups] = await Promise.all([
        api.getUserDetails(friendId),
        api.getPrivateExpenses(),
        api.getGroups(), 
      ]);

      const friendDetails: EnrichedFriend = {
        id: friendId, 
        username: friendInfo.username,
        email: friendInfo.email,
      };

        let totalBalance = 0;
      const timelineItems: TimelineItem[] = [];

      // 1. Processa le spese private
      const relevantPrivateExpenses = privateExpenses.filter(([, p]) => 
        p.length === 2 && p.some(u => u.user_id === friendId)
      );

      for (const expenseItem of relevantPrivateExpenses) {
        const [expense, participants] = expenseItem;
        const myParticipation = participants.find(p => p.user_id === currentUser.id);
        
        if (expense.paid_by === currentUser.id) {
          totalBalance += myParticipation ? (expense.total_amount - (myParticipation.amount_due || 0)) : expense.total_amount / 2;
        } else {
          totalBalance -= myParticipation?.amount_due || 0;
        }
        
        timelineItems.push({
          type: 'private_expense',
          date: expense.creation_date,
          data: expenseItem,
        });
      }

      // 2. Processa i gruppi in comune
      for (const group of myGroups) {
        const [groupMembers, groupExpenses] = await Promise.all([
          api.getGroupMembers(group.id),
          api.getGroupExpenses(group.id),
        ]);
        
        if (!groupMembers.some(m => m.user_id === friendId)) continue;

        let balanceInGroup = 0;
        for (const [expense, participants] of groupExpenses) {
          const myParticipation = participants.find(p => p.user_id === currentUser.id);
          const friendParticipation = participants.find(p => p.user_id === friendId);
          
          if (!myParticipation && !friendParticipation) continue;

          if (expense.paid_by === currentUser.id) {
            balanceInGroup += friendParticipation?.amount_due || 0;
          } else if (expense.paid_by === friendId) {
            balanceInGroup -= myParticipation?.amount_due || 0;
          }
        }
        
        if (Math.abs(balanceInGroup) > 0.01) {
          totalBalance += balanceInGroup;
          timelineItems.push({
            type: 'group_balance',
            date: group.creation_date,
            data: { group, balance: balanceInGroup },
          });
        }
      }
      
      // 3. Ordina la timeline finale
      const sortedTimeline = timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { friend: friendDetails, timeline: sortedTimeline, balance: totalBalance };
    },
    enabled: !!currentUser && !isNaN(friendId),
  });

  if (isLoading) return <div>Caricamento...</div>;
  if (!data) return <div>Dati non trovati.</div>;

  const { friend, timeline, balance } = data;
  const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Riepilogo con {friend.username}</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <p className="text-lg text-gray-600">
        {balance > 0.01 
          ? `In totale, ${friend.username} ti deve:` 
          : balance < -0.01 
            ? `In totale, tu devi a ${friend.username}:` 
            : 'Siete in pari'}
      </p>
      {Math.abs(balance) > 0.01 && (
        <p className={`text-4xl font-bold mt-2 ${balanceColor}`}>
          {Math.abs(balance).toFixed(2)} €
        </p>
      )}
    </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Cronologia Spese</h2>
        <Button onClick={() => setAddModalOpen(true)}>Aggiungi Spesa</Button>
      </div>

      {/* --- SEZIONE DELLA LISTA SPESE AGGIORNATA --- */}
      <ul className="space-y-3">        
        {timeline.length > 0 ? timeline.map((item) => {
      
          if (item.type === 'private_expense') {
            const expenseItem = item.data;
            const [expense, participants] = expenseItem;
            
            let userFinancialStatus = { text: 'Devi dare', amount: 0, color: 'text-red-600' };
            if (currentUser) {
              const myShare = participants.find(p=>p.user_id === currentUser.id)?.amount_due || 0;
              if (expense.paid_by === currentUser.id) {
                userFinancialStatus = { text: 'Ti deve', amount: expense.total_amount - myShare, color: 'text-green-600' };
              } else {
                userFinancialStatus = { text: 'Gli devi', amount: myShare, color: 'text-red-600' };
              }
            }

            return (
              <li key={expense.id}>
                <button
                  onClick={() => setSelectedExpense(expenseItem)}
                  className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 shadow-sm border-l-4 border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-500">{expense.desc}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(expense.creation_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm ${userFinancialStatus.color}`}>
                        {userFinancialStatus.text}
                      </p>
                      <p className={`font-bold text-lg ${userFinancialStatus.color}`}>
                        {userFinancialStatus.amount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          }

          else {
            // Renderizza un riepilogo del saldo di gruppo
            const { group, balance: groupBalance } = item.data;
            const groupBalanceColor = groupBalance > 0 ? 'text-green-600' : 'text-red-600';
            return (
              <li key={`grp-${group.id}`}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-purple-700">{group.group_name}</p>
                      <p className="text-sm text-gray-500 mt-1">Saldo in questo gruppo</p>
                    </div>
                    <div className={`text-right ${groupBalanceColor}`}>
                      <p className="text-sm">{groupBalance > 0 ? 'Ti deve' : 'Gli devi'}</p>
                      <p className="font-bold text-lg">{Math.abs(groupBalance).toFixed(2)} €</p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          }
          })
         : (
          <p className="text-center text-gray-500 py-4">Nessuna spesa registrata con questo amico.</p>
        )}
      </ul>

      
      {/* Modale per Aggiungere Spesa 1-a-1 */}
      <AddFriendExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        friend={friend}
      />
       {selectedExpense && (
        <PrivateExpenseDetailModal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          expenseData={selectedExpense}
          friend={friend}
          onEditClick={() => handleOpenEditModal(selectedExpense)}
        />
      )}
      
      {editingExpense && (
        <EditPrivateExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expenseData={editingExpense}
          friend={friend}
        />
      )}
    </div>
  );
}