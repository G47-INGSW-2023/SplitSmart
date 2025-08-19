'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { Button } from '@/component/ui/button';
import { ExpenseWithParticipants, EnrichedFriend } from '@/types';
import AddFriendExpenseModal from '@/component/friends/addFriendsExpenseModal';
import ExpenseDetailModal from '../../groups/[groupId]/expensesDetailModal';
import PrivateExpenseDetailModal from '../privateExpenseDetailModal';
import EditPrivateExpenseModal from '../editPrivateExpenseModal';

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
      {expenses.length > 0 ? (
        <ul className="space-y-3">
          {expenses.map((expenseItem) => {
            const [expense] = expenseItem;
            
            // Logica di calcolo finanziario (adattata)
            let userFinancialStatus = { text: '', amount: 0, color: 'text-gray-500' };
            
            if (currentUser) {
              const amountPerPerson = expense.total_amount / 2;
              
              if (expense.paid_by === currentUser.id) {
                userFinancialStatus = {
                  text: 'Ti deve',
                  amount: amountPerPerson,
                  color: 'text-green-600',
                };
              } else {
                userFinancialStatus = {
                  text: 'Gli devi',
                  amount: amountPerPerson,
                  color: 'text-red-600',
                };
              }
            }

            return (
              <li key={expense.id}>
                <button
                  onClick={() => setSelectedExpense(expenseItem)}
                  className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{expense.desc}</p>
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
          })}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-4">Nessuna spesa registrata con questo amico.</p>
      )}
      
      {/* Modale per Aggiungere Spesa 1-a-1 */}
      <AddFriendExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        friend={friend}
      />

      {/* Modale di Dettaglio Spesa (riutilizzato) */}
      {selectedExpense && (
        <ExpenseDetailModal
          expenseData={selectedExpense}
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          // Passiamo un groupId fittizio o null, il modale non lo usa per le azioni
          // che non sono specifiche di un gruppo (come promuovere admin)
          groupId={-1} // -1 per indicare che non è in un gruppo
          isCurrentUserAdmin={false} // Le spese private non hanno admin di gruppo
          // onEditClick richiederà di creare un modale EditFriendExpenseModal
          onEditClick={() => alert("Funzionalità di modifica da implementare per le spese private.")}
        />
      )}

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