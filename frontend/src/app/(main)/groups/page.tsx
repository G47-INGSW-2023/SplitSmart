'use client';

import { GroupList } from '@/component/groups/groupList';
import { CreateGroupModal } from '@/component/groups/createGroupModal';
import { Button } from '@/component/ui/button';
import { useState } from 'react';

export default function GroupsPage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button onClick={() => setCreateModalOpen(true)}>Crea Nuovo Gruppo</Button>
      </div>
      
      <GroupList />

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  );
}