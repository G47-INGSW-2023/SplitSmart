import { use } from 'react';
import GroupDetailClient from './groupDetailClient'; 

interface GroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupDetailPage(props: GroupDetailPageProps) {
  const params = use(props.params);
  const groupId = parseInt(params.groupId, 10);

  if (isNaN(groupId)) {
    return <div>ID del gruppo non valido.</div>;
  }

  return <GroupDetailClient groupId={groupId} />;
}
