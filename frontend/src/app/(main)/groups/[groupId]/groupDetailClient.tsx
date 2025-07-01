'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExpenseWithParticipants, ProcessedMember} from '@/types';
import { useAuth } from '@/lib/authContext';
import ExpensesTab from './expensesTab';
import MembersTab from './membersTab';   
import { Button } from '@/component/ui/button';
import DeleteGroupModal from './deleteGroupModal';
import EditGroupModal from './editGroupModal';
import { simplifyDebts } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import ExpenseDetailModal from './expensesDetailModal';
import EditExpenseModal from './editExpenseModal';


type Tab = 'expenses' | 'members';

interface GroupDetailClientProps {
  groupId: number;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { user: currentUser } = useAuth(); 

  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParticipants | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithParticipants | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: processedData, isLoading, isError, error } = useQuery({
    queryKey: ['group-details-simplified', groupId],
    queryFn: async () => {
      if (!currentUser) return null;

      const [group, membersResponse, admins, expensesWithParticipants] = await Promise.all([
        api.getGroupById(groupId),
        api.getGroupMembers(groupId),
        api.getGroupAdmins(groupId),
        api.getGroupExpenses(groupId),
      ]);
      
      const directDebts = new Map<string, number>();
      for (const [expense, participants] of expensesWithParticipants) {
        for (const p of participants) {
          if (p.user_id !== expense.paid_by) {
            const key = `${p.user_id}-${expense.paid_by}`;
            const amount = p.amount_due || 0;
            directDebts.set(key, (directDebts.get(key) || 0) + amount);
          }
        }
      }

      const netDebts = new Map<string, number>();
      for (const [key, amount] of directDebts.entries()) {
        const [from, to] = key.split('-');
        const reverseKey = `${to}-${from}`;
        const reverseAmount = directDebts.get(reverseKey) || 0;
        
        if (amount > reverseAmount) netDebts.set(key, amount - reverseAmount);
      }
      
      const netBalances = new Map<number, number>();
      for (const [expense, participants] of expensesWithParticipants) {
        for (const p of participants) {
          netBalances.set(p.user_id, (netBalances.get(p.user_id) || 0) - (p.amount_due || 0));
        }
        netBalances.set(expense.paid_by, (netBalances.get(expense.paid_by) || 0) + expense.total_amount);
      }
      
      const allUserDetails = await Promise.all(
        membersResponse.map(async m => ({...await api.getUserDetails(m.user_id), id: m.user_id}))
      );
      const userMap = new Map(allUserDetails.map(u => [u.id, u]));

      const membersWithNetBalance = allUserDetails.map(user => ({
        ...user,
        netBalance: netBalances.get(user.id) || 0,
      }));

      const simplifiedTransactions = simplifyDebts(membersWithNetBalance);
      const adminIds = new Set(admins.map(a => a.user_id));

      const finalMembers: ProcessedMember[] = allUserDetails.map(user => {
        const relatedTransactions = simplifiedTransactions.filter(
          tx => tx.fromId === user.id || tx.toId === user.id
        );

        return {
          ...user,
          isAdmin: adminIds.has(user.id),
          netBalance: netBalances.get(user.id) || 0,
          debts: relatedTransactions.map(tx => ({
            otherMemberId: tx.fromId === user.id ? tx.toId : tx.fromId,
            otherMemberName: tx.fromId === user.id ? tx.toName : tx.fromName,
            amount: tx.fromId === user.id ? -tx.amount : tx.amount,
          })),
        };
      });

      return {
        group,
        members: finalMembers,
        expenses: expensesWithParticipants, 
        isCurrentUserAdmin: adminIds.has(currentUser.id),
      };
    },
    enabled: !isNaN(groupId) && !!currentUser,
  });

  useEffect(() => {
    const expenseIdToOpen = searchParams.get('openExpense');
    
    if (expenseIdToOpen && processedData?.expenses) {
      const expenseToSelect = processedData.expenses.find(
        ([exp]) => exp.id === parseInt(expenseIdToOpen, 10)
      );

      if (expenseToSelect) {
        setSelectedExpense(expenseToSelect); // Imposta lo stato locale
        
        const newUrl = `/groups/${groupId}`;
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [processedData, searchParams, groupId, router]); 

  const handleOpenEditModal = (expenseData: ExpenseWithParticipants) => {
    setSelectedExpense(null);
    setEditingExpense(expenseData);
  };

  if (isLoading) return <div>Caricamento...</div>;
  if (isError) return <div className="text-red-500">Errore: {error.message}</div>;
  if (!processedData) return <div>Dati non disponibili.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{processedData.group.group_name}</h1>
          <p className="text-gray-500 mt-1">{processedData.group.desc}</p>
        </div>
        {processedData.isCurrentUserAdmin && (
          <div className="flex-shrink-0 ml-4 flex gap-2">
            <Button
              variant="secondary"
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

      <div>
        {activeTab === 'expenses' && (
          <ExpensesTab 
            groupId={groupId} 
            initialExpenses={processedData.expenses}
            isCurrentUserAdmin={processedData.isCurrentUserAdmin}
            onSelectExpense={setSelectedExpense}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab
            groupId={groupId}
            initialMembers={processedData.members}
            isCurrentUserAdmin={processedData.isCurrentUserAdmin}
          />
        )}
      </div>
      
      {selectedExpense && (
        <ExpenseDetailModal
          expenseData={selectedExpense}
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          groupId={groupId}
          isCurrentUserAdmin={processedData.isCurrentUserAdmin}
          onEditClick={() => handleOpenEditModal(selectedExpense)}
        />
      )}
      {editingExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          groupId={groupId}
          expenseData={editingExpense}
        />
      )}
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        group={processedData.group}
      />
      
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        groupId={groupId}
        groupName={processedData.group.group_name || ''}
      />
    </div>
  );
}