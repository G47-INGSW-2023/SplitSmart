'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Group } from '@/types';
import { useAuth } from '@/lib/authContext';
import ExpensesTab from './expensesTab';
import MembersTab from './membersTab';   
import { Button } from '@/component/ui/button';
import DeleteGroupModal from './deleteGroupModal';

type Tab = 'expenses' | 'members'; // Definiamo i tipi di tab possibili

interface GroupDetailClientProps {
  groupId: number;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const { user: currentUser } = useAuth(); 

   const { data: processedData, isLoading, isError, error } = useQuery({
    queryKey: ['group-details-processed', groupId],
    queryFn: async () => {
      if (!currentUser) return null; // Guardia di sicurezza

      const [group, members, admins, expensesWithParticipants] = await Promise.all([
        api.getGroupById(groupId),
        api.getGroupMembers(groupId),
        api.getGroupAdmins(groupId),
        api.getGroupExpenses(groupId),
      ]);
      
      // --- Logica di calcolo saldi ---
      const balances = new Map<number, number>();
      for (const [expense, participants] of expensesWithParticipants) {
        const myParticipation = participants.find(p => p.user_id === currentUser.id);
        const myShare = myParticipation?.amount_due || 0;
        if (expense.paid_by === currentUser.id) {
          for (const p of participants) {
            if (p.user_id !== currentUser.id) {
              balances.set(p.user_id, (balances.get(p.user_id) || 0) + (p.amount_due || 0));
            }
          }
        } else if (myParticipation) {
          balances.set(expense.paid_by, (balances.get(expense.paid_by) || 0) - myShare);
        }
      }

      const adminIds = new Set(admins.map(a => a.user_id));
      
      const memberDetails = await Promise.all(
        members.map(async (member) => {
          const userDetails = await api.getUserDetails(member.user_id);
          return {
            id: member.user_id,
            username: userDetails.username,
            email: userDetails.email,
            isAdmin: adminIds.has(member.user_id),
            balance: balances.get(member.user_id) || 0,
          };
        })
      );

      const totalBalance = Array.from(balances.values()).reduce((sum, amount) => sum + amount, 0);

      return {
        group,
        members: memberDetails,
        expenses: expensesWithParticipants,
        totalBalance,
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
          <p className="text-gray-500 mt-1">{processedData.group.desc || 'Nessuna descrizione.'}</p>
        </div>
        {processedData.isCurrentUserAdmin && (
          <div className="flex-shrink-0 ml-4">
            <Button
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
              className="w-auto"
            >
              Elimina Gruppo
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-white shadow-sm text-center">
        <p className="text-sm text-gray-500">Il tuo saldo in questo gruppo</p>
        <p className={`text-2xl font-bold ${processedData.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {processedData.totalBalance >= 0 ? '+' : ''}{processedData.totalBalance.toFixed(2)} €
        </p>
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