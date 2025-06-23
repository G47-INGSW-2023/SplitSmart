'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Group, ProcessedMember, BalanceDetail, MemberWithDetails, DebtDetail } from '@/types';
import { useAuth } from '@/lib/authContext';
import ExpensesTab from './expensesTab';
import MembersTab from './membersTab';   
import { Button } from '@/component/ui/button';
import DeleteGroupModal from './deleteGroupModal';
import EditGroupModal from './editGroupModal';


type Tab = 'expenses' | 'members'; // Aggiungiamo la nuova tab

interface GroupDetailClientProps {
  groupId: number;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { user: currentUser } = useAuth(); 

   const { data: processedData, isLoading, isError, error } = useQuery({
    queryKey: ['group-debts-matrix', groupId],
    queryFn: async () => {
      if (!currentUser) return null;

      // Corretto il nome della variabile in `expensesWithParticipants`
      const [group, membersResponse, admins, expensesWithParticipants] = await Promise.all([
        api.getGroupById(groupId),
        api.getGroupMembers(groupId),
        api.getGroupAdmins(groupId),
        api.getGroupExpenses(groupId),
      ]);
      
      // --- Logica di calcolo saldi (spostata in cima per chiarezza) ---
      const netBalances = new Map<number, number>();
      for (const [expense, participants] of expensesWithParticipants) {
        for (const p of participants) {
          netBalances.set(p.user_id, (netBalances.get(p.user_id) || 0) - (p.amount_due || 0));
        }
        netBalances.set(expense.paid_by, (netBalances.get(expense.paid_by) || 0) + expense.total_amount);
      }
      
      const adminIds = new Set(admins.map(a => a.user_id));
      const allUserDetails = await Promise.all(
        membersResponse.map(async m => ({...await api.getUserDetails(m.user_id), id: m.user_id}))
      );
      const userMap = new Map(allUserDetails.map(u => [u.id, u]));

      // Costruiamo i dati finali per i membri
       const finalMembers: ProcessedMember[] = allUserDetails.map(user => {
        let netBalance = 0;
        const debts: DebtDetail[] = [];

        for (const [key, amount] of netDebts.entries()) {
          const [fromId, toId] = key.split('-').map(Number);
          
          if (user.id === fromId) { // Lui è il debitore
            netBalance -= amount;
            debts.push({
              otherMemberId: toId,
              otherMemberName: userMap.get(toId)?.username || 'Sconosciuto',
              amount: -amount,
            });
          } else if (user.id === toId) { // Lui è il creditore
            netBalance += amount;
            debts.push({
              otherMemberId: fromId,
              otherMemberName: userMap.get(fromId)?.username || 'Sconosciuto',
              amount: amount,
            });
          }
        }
        
        return {
          ...user,
          isAdmin: adminIds.has(user.id),
          netBalance: netBalance,
          debts: debts, // Assicurati che l'array `debts` sia qui
        };
      });

      // Calcoliamo il saldo totale dell'utente corrente
      const myTotalBalance = netBalances.get(currentUser.id) || 0;

      return {
        group,
        members: finalMembers,
        expenses: expensesWithParticipants,
        totalBalance: myTotalBalance, // Aggiunto di nuovo
        isCurrentUserAdmin: adminIds.has(currentUser.id),
      };
    },
    enabled: !isNaN(groupId) && !!currentUser,
  });

  if (isLoading) return <div>Caricamento...</div>;
  if (isError) return <div className="text-red-500">Errore: {error.message}</div>;
  if (!processedData) return <div>Dati non disponibili.</div>;

  return (
    <div className="space-y-6">
       {/* Intestazione con pulsante Impostazioni/Elimina */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{processedData.group.group_name}</h1>
          <p className="text-gray-500 mt-1">{processedData.group.desc}</p>
        </div>
        {processedData.isCurrentUserAdmin && (
          <div className="flex-shrink-0 ml-4 flex gap-2">
            <Button
              variant="secondary" // Usiamo uno stile meno "pericoloso"
              onClick={() => setEditModalOpen(true)}
              className="w-auto"
            >
              Modifica
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
              className="w-auto"
            >
              Elimina
            </Button>
          </div>
        )}
      </div>
      {/* Selettore Tab */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Spese
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Membri
          </button>
        </nav>
      </div>

      {/* Contenuto delle Tab */}
      <div>
        {activeTab === 'expenses' && (
          <ExpensesTab 
            groupId={groupId} 
            initialExpenses={processedData.expenses} 
          />
        )}
        {activeTab === 'members' && (
          <MembersTab
            groupId={groupId}
            initialMembers={processedData.members}
            isCurrentUserAdmin={processedData.isCurrentUserAdmin}
            totalBalance={processedData.totalBalance} 
          />
        )}
      </div>
      
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        group={processedData.group}
      />
      
      {/* Modale di cancellazione */}
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        groupId={groupId}
        groupName={processedData.group.group_name || ''}
      />
    </div>
  );
}