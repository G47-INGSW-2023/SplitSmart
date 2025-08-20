import { use } from 'react';
import GroupDetailClient from './groupDetailClient'; // Importa il Client Component

interface GroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

// 1. Rendi la funzione del componente `async`
export default function GroupDetailPage(props: GroupDetailPageProps) {
  
  // 2. "Srotola" la prop `params`
  const params = use(props.params);
  const groupId = parseInt(params.groupId, 10);

  if (isNaN(groupId)) {
    return <div>ID del gruppo non valido.</div>;
  }

  // 3. Passa l'ID numerico al Client Component
  return <GroupDetailClient groupId={groupId} />;
}
