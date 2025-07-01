'use client';

import { useState } from 'react';
// --- CORREZIONE PERCORSI IMPORT ---
import FriendsListTab from '@/component/friends/friendsListTab';
import FriendRequestsTab from '@/component/friends/friendRequestsTab';
import AddFriendTab from '@/component/friends/addFriendTab';

// Definiamo i tipi di tab possibili
type ActiveTab = 'my-friends' | 'requests' | 'add-friend';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-friends');

  // Funzione per renderizzare il contenuto della tab attiva
  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-friends':
        return <FriendsListTab />;
      case 'requests':
        return <FriendRequestsTab />;
      case 'add-friend':
        return <AddFriendTab />;
      default:
        return null; // Non dovrebbe mai accadere
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Gestione Amici</h1>
      
      {/* Selettore Tab con stili completi */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('my-friends')}
            // --- CLASSI COMPLETATE ---
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'my-friends'
                ? 'border-blue-500 text-blue-600' // Stile attivo
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' // Stile inattivo
              }`}
          >
            I Miei Amici
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            // --- CLASSI COMPLETATE ---
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Richieste Ricevute
          </button>
          
          <button
            onClick={() => setActiveTab('add-friend')}
            // --- CLASSI COMPLETATE ---
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'add-friend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Aggiungi Amico
          </button>
        </nav>
      </div>

      {/* Contenuto della Tab Attiva */}
      <div className="mt-6"> {/* Aggiunto un po' più di margine superiore */}
        {renderTabContent()}
      </div>
    </div>
  );
}