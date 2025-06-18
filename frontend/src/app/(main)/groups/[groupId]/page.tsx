'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Group } from '@/types';

interface GroupDetailPageProps {
  params: {
    groupId: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const groupId = parseInt(params.groupId, 10);

  // Usiamo React Query per recuperare i dati di questo gruppo specifico
  const { data: group, isLoading, isError, error } = useQuery<Group>({
    // La queryKey deve essere unica per questo gruppo specifico.
    // Usiamo un array con 'group' e l'ID del gruppo.
    queryKey: ['group', groupId],
    // La queryFn chiama la nostra nuova funzione API, passandogli l'ID.
    queryFn: () => api.getGroupById(groupId),
    // `enabled` previene l'esecuzione della query se l'ID non è un numero valido.
    enabled: !isNaN(groupId),
  });

  if (isLoading) {
    return <div>Caricamento dettagli del gruppo...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Errore: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{group?.group_name}</h1>
      <p className="text-gray-500">{group?.desc}</p>
      <hr/>
      <div>
        <h2 className="text-2xl font-semibold text-gray-700">Membri</h2>
        {/* Qui andrà la lista dei membri */}
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gray-700">Spese</h2>
        {/* Qui andrà la lista delle spese */}
      </div>
    </div>
  );
}