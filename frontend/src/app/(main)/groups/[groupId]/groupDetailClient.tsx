'use client';

import { useState } from 'react';
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['group-details', groupId],
    queryFn: async () => {
      // Eseguiamo tutte le chiamate necessarie in parallelo per efficienza
      const [group, members, admins] = await Promise.all([
        api.getGroupById(groupId),
        api.getGroupMembers(groupId),
        api.getGroupAdmins(groupId)
      ]);

      // Combiniamo i dati
      const adminIds = new Set(admins.map(a => a.user_id));

      const memberDetails = await Promise.all(
        members.map(async (member) => { 
          const userDetails = await api.getUserDetails(member.user_id);
    
          return {
            id: member.user_id, 
            ...userDetails,   
            isAdmin: adminIds.has(member.user_id), 
          };
        })
      );

      return {
        group,
        members: memberDetails,
        admins: Array.from(adminIds), // Un array semplice di ID admin
      };
    },
    enabled: !isNaN(groupId),
  });

  const isCurrentUserAdmin = !!currentUser && !!data?.admins.includes(currentUser.id);

  if (isLoading) return <div>Caricamento...</div>;
  if (isError) return <div className="text-red-500">Errore: {error.message}</div>;
  if (!data || !data.group) return <div>Nessun dato trovato per questo gruppo.</div>;

  return (
    <div className="space-y-6">
       {/* Intestazione con pulsante Impostazioni/Elimina */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{data.group.group_name}</h1>
          <p className="text-gray-500 mt-1">{data.group.desc || 'Nessuna descrizione.'}</p>
        </div>
        {isCurrentUserAdmin && (
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
        {activeTab === 'expenses' && <ExpensesTab groupId={groupId} />}
        {/* Passiamo i dati già caricati ai componenti figli */}
        {activeTab === 'members' && (
          <MembersTab
            groupId={groupId}
            initialMembers={data.members}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        )}
      </div>

      {/* Modale di cancellazione */}
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        groupId={groupId}
        groupName={data.group?.group_name || ''}
      />
    </div>
  );
}