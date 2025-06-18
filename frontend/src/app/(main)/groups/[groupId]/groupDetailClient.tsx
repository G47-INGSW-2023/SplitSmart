'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Group } from '@/types';
import ExpensesTab from './expensesTab'; // Creeremo questo componente
import MembersTab from './membersTab';   // E anche questo

type Tab = 'expenses' | 'members'; // Definiamo i tipi di tab possibili

interface GroupDetailClientProps {
  groupId: number;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  // Stato per tenere traccia della tab attiva
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  const { data: group, isLoading, isError, error } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: () => api.getGroupById(groupId),
    enabled: !isNaN(groupId),
  });

  if (isLoading) return <div>Caricamento...</div>;
  if (isError) return <div className="text-red-500">Errore: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Intestazione del Gruppo */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{group?.group_name}</h1>
        <p className="text-gray-500 mt-1">{group?.desc || 'Nessuna descrizione per questo gruppo.'}</p>
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
        {activeTab === 'members' && <MembersTab groupId={groupId} />}
      </div>
    </div>
  );
}