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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-friends':
        return <FriendsListTab />;
      case 'requests':
        return <FriendRequestsTab />;
      case 'add-friend':
        return <AddFriendTab />;
      default:
        return null; 
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-1 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestione Amici</h1>
      
      {/* Selettore Tab con stili completi */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex justify-around" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('my-friends')}
            className={`w-1/3 py-3 px-1 text-center border-b-2 font-medium   text-sm transition-colors
              ${activeTab === 'my-friends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <span className="hidden sm:inline">I Miei Amici</span>
            {/* Testo per schermi piccoli */}
            <span className="sm:hidden">Amici</span>         
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            // --- CLASSI COMPLETATE ---
            className={`w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <span className="hidden sm:inline">Richieste Ricevute</span>
            <span className="sm:hidden">Richieste</span>
          </button>

          <button
            onClick={() => setActiveTab('add-friend')}
            // --- CLASSI COMPLETATE ---
            className={`w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'add-friend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <span className="hidden sm:inline">Aggiungi Amico</span>
            <span className="sm:hidden">Aggiungi</span>
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