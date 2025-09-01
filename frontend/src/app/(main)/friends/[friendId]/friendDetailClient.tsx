'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { Button } from '@/component/ui/button';
import { ExpenseWithParticipants, EnrichedFriend } from '@/types';
import AddFriendExpenseModal from '@/component/friends/addFriendsExpenseModal';
import PrivateExpenseDetailModal from '../../../../component/friends/privateExpenseDetailModal';
import EditPrivateExpenseModal from '../../../../component/friends/editPrivateExpenseModal';
import { TimelineItem } from '@/types'; 
import { Trash2 } from 'lucide-react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FriendDetailClientProps {
  friendId: number;
}

export default function FriendDetailClient({ friendId }: FriendDetailClientProps) {
  const { user: currentUser } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);  
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParticipants | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithParticipants | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter(); 

  const removeFriendMutation = useMutation({
    mutationFn: () => api.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends-list', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['private-expenses', currentUser?.id] });
      
      alert("Amico rimosso con successo.");
      router.push('/friends');
    },
    onError: (error) => {
      alert(`Errore durante la rimozione dell'amico: ${error.message}`);
    }
  });

  const handleOpenEditModal = (expenseData: ExpenseWithParticipants) => {
    setSelectedExpense(null);
    setEditingExpense(expenseData);
  };

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

      privateExpenses
        .filter(([, p]) => p.length === 2 && p.some(u => u.user_id === friendId))
        .forEach(expenseItem => {
          const [expense, participants] = expenseItem;
          const myParticipation = participants.find(p => p.user_id === currentUser.id);
          const myShare = myParticipation?.amount_due || 0;

          if (expense.paid_by === currentUser.id) totalBalance += myShare;
          else totalBalance -= myShare;

          timelineItems.push({ type: 'private_expense', date: expense.creation_date, data: expenseItem });
        });

      await Promise.all(myGroups.map(async (group) => {
        const [groupMembers, groupExpenses] = await Promise.all([
          api.getGroupMembers(group.id),
          api.getGroupExpenses(group.id),
        ]);
        
        if (!groupMembers.some(m => m.user_id === friendId)) return;

        let balanceInGroup = 0;
        for (const [expense, participants] of groupExpenses) {
          const myP = participants.find(p => p.user_id === currentUser.id);
          const friendP = participants.find(p => p.user_id === friendId);
          if (!myP || !friendP) continue;

          if (expense.paid_by === currentUser.id) balanceInGroup += friendP.amount_due || 0;
          else if (expense.paid_by === friendId) balanceInGroup -= myP.amount_due || 0;
        }
        
        if (Math.abs(balanceInGroup) > 0.01) {
          totalBalance += balanceInGroup;
          timelineItems.push({
            type: 'group_balance',
            date: group.creation_date,
            data: { group, balance: balanceInGroup },
          });
        }
      }));
      
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{friend.username}</h1>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
        <p className={`text-base sm:text-lg text-gray-600  ${balanceColor}`}>
          {balance > 0.01 
            ? `In totale, ti deve dare` 
            : balance < -0.01 
              ? `In totale, devi dare` 
              : 'Siete in pari'}
        </p>
        {Math.abs(balance) > 0.01 && (
          <p className={`text-2xl sm:text-4xl font-bold mt-2 ${balanceColor}`}>
            {Math.abs(balance).toFixed(2)} €
          </p>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-3">
        <Button onClick={() => setAddModalOpen(true)}>Aggiungi Spesa</Button>
        <div className="flex-shrink-0 w-full sm:w-auto sm:text-right">
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm(`Sei sicuro di voler rimuovere ${friend.username}?`)) {
                removeFriendMutation.mutate();
              }
            }}
            disabled={removeFriendMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>{removeFriendMutation.isPending ? 'Rimozione...' : 'Rimuovi Amico'}</span>
          </Button>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Cronologia Spese</h2>
      </div>

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
                  className="w-full text-left bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:bg-gray-50 shadow-sm border-l-4 border-blue-500 transition-colors"
                >
                  <div className="flex flex-row justify-between sm:items-center">
                    <div>
                      <p className="font-semibold text-blue-500">{expense.desc}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(expense.creation_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                    <div className="text-right ">
                      <p className={`text-sm ${userFinancialStatus.color}`}>
                        {userFinancialStatus.text}
                      </p>
                      <p className={`font-bold text-base sm:text-lg ${userFinancialStatus.color}`}>
                        {userFinancialStatus.amount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          }
          else {
            const { group, balance: groupBalance } = item.data;
            const groupBalanceColor = groupBalance > 0 ? 'text-green-600' : 'text-red-600';
            return (
              <li key={`grp-${group.id}`}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 hover:bg-gray-50"
                >
                  <div className="flex flex-row justify-between items-center">
                    <div>
                      <p className="font-semibold text-purple-700">{group.group_name}</p>
                      <p className="text-sm text-gray-500 mt-1">Gruppo condiviso</p>
                    </div>
                    <div className={`text-right ${groupBalanceColor}`}>
                      <p className="text-sm">{groupBalance > 0 ? 'Ti deve' : 'Gli devi'}</p>
                      <p className="font-bold text-base sm:text-lg">{Math.abs(groupBalance).toFixed(2)} €</p>
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