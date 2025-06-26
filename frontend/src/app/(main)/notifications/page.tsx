'use client';

import InvitesTab from '@/component/notifications/invitesTab';
import NotificationsTab from '@/component/notifications/notificationsTab';
import { useState } from 'react';

type ActiveTab = 'notifications' | 'invites';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('notifications');

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Centro Notifiche</h1>

      {/* Selettore Tab */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Notifiche
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'invites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Inviti
          </button>
        </nav>
      </div>

      {/* Contenuto Condizionale delle Tab */}
      <div>
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'invites' && <InvitesTab />}
      </div>
    </div>
  );
}