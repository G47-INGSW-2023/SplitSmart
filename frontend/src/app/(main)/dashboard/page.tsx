'use client';

import { GroupList } from '@/component/groups/groupList';
import { CreateGroupModal } from '@/component/groups/createGroupModal';
import { Button } from '@/component/ui/button';
import { useState } from 'react';

export default function DashboardPage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-8"> {/* Aumentato lo spazio per arieggiare */}
      <div className="flex justify-between items-center">
        <div>
          {/* --- TESTO AGGIORNATO --- */}
          <h1 className="text-3xl font-bold text-gray-800">La tua Dashboard</h1>
          <p className="text-gray-500 mt-1">Gestisci qui i tuoi gruppi e le tue spese.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>Crea Gruppo</Button>
      </div>
      
      {/* Questi componenti ora conterranno la logica reale */}
      <GroupList />

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  );
}