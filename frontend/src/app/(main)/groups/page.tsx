'use client';

import { GroupList } from '@/component/groups/settings/groupList';
import { CreateGroupModal } from '@/component/groups/settings/createGroupModal';
import { Button } from '@/component/ui/button';
import { useState } from 'react';

export default function GroupsPage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-1 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">I tuoi Gruppi</h1>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Crea Nuovo Gruppo
        </Button>
      </div>
      <GroupList/>
      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}