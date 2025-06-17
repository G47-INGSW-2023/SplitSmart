'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GroupCard } from './groupCard'; // Creeremo questo componente
import { Group } from '@/types'; // Importa il tipo corretto

// Componente per lo stato di caricamento
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg bg-white animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

export function GroupList() {
  // useQuery gestisce tutto: fetching, caching, loading, errori...
  const { data: groups, isLoading, isError, error } = useQuery<Group[]>({
    queryKey: ['groups'],    // Chiave unica per questa query.
    queryFn: api.getGroups,  // Funzione che recupera i dati.
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <div className="text-red-600 bg-red-100 p-4 rounded-lg">Errore nel caricamento dei gruppi: {error.message}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">I tuoi Gruppi</h2>
      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Non fai ancora parte di nessun gruppo.</p>
          <p className="text-gray-500 mt-1">Creane uno per iniziare a condividere le spese!</p>
        </div>
      )}
    </div>
  );
}