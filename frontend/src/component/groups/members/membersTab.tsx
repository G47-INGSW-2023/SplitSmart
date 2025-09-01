'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { ProcessedMember } from '@/types';
import { Button } from '@/component/ui/button';
import MemberDetailModal from './memberDetailModal';
import AddMemberModal from './addMemberModal';

interface MembersTabProps {
  groupId: number;
  initialMembers: ProcessedMember[];
  isCurrentUserAdmin: boolean;
}

const MemberRow = ({ member, onAdminActionsClick }: { member: ProcessedMember, onAdminActionsClick: (member: ProcessedMember) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user: currentUser } = useAuth();
  
  const isSelf = member.id === currentUser?.id;
  const balance = member.netBalance;
  const balanceColor = balance > 0.01 ? 'text-green-600' : balance < -0.01 ? 'text-red-600' : 'text-gray-500';

  return (
    <li className="bg-white rounded-lg shadow-sm transition-all duration-300 overflow-hidden">
      <div className="w-full flex flex-col sm:flex-row text-left">
        <button
          onClick={() => !isSelf && onAdminActionsClick(member)}
          disabled={isSelf}
          className="flex-grow p-3 sm:p-4 flex items-center justify-start gap-2 hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="font-medium text-gray-900">{member.username}</span>
          {isSelf && <span className="font-normal text-blue-600">(Tu)</span>}
          {member.isAdmin && <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full">Admin</span>}
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 w-full sm:w-40 p-3 sm:p-4 flex justify-end text-right items-center sm:flex-col sm:items-end sm:justify-center hover:bg-gray-50 transition-colors border-t sm:border-t-0 sm:border-l border-gray-200"
        >
          {Math.abs(balance) < 0.01 ? (
            <p className="text-gray-500 font-medium">In pari</p>
          ) : (
            <>
              <p className={`text-md px-1 ${balanceColor}`}>
                {balance > 0 ? 'Deve ricevere' : 'Deve dare'}
              </p>
              <p className={`font-bold text-lg ${balanceColor}`}>
                {Math.abs(balance).toFixed(2)} €
              </p>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
       <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          {member.debts.length > 0 ? (
            <ul className="text-sm space-y-2">
              {member.debts.map(debt => {
                const isReceiving = debt.amount > 0;
                const colorClass = isReceiving ? 'text-green-600' : 'text-red-500';
                
                return (
                  <li key={debt.otherMemberId} className="flex justify-end items-center">
                    <p className="text-gray-600">
                      {isReceiving ? 'Riceve ' : 'Paga '}
                      <span className={`font-bold ${colorClass}`}>
                        {Math.abs(debt.amount).toFixed(2)} €
                      </span>
                      <span className="font-medium">{isReceiving ? ' da ' : ' a '}{debt.otherMemberName}</span>                      
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-center text-gray-500">In pari con tutti i membri del gruppo.</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function MembersTab({ groupId, initialMembers, isCurrentUserAdmin }: MembersTabProps) {
  const [selectedMember, setSelectedMember] = useState<ProcessedMember | null>(null);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);

  return (
    <div className="space-y-6">   
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-gray-800">Membri e Saldi</h3>
        {isCurrentUserAdmin && (
          <Button 
            onClick={() => setAddMemberModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Aggiungi Membro
          </Button>
        )}
      </div>

       <ul className="space-y-3">
        {initialMembers.map(member => (
          <MemberRow
              key={member.id}
              member={member}
              onAdminActionsClick={setSelectedMember}
          />
        ))}
      </ul>
      
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          groupId={groupId}
          onClose={() => setSelectedMember(null)}
          isCurrentUserAdmin={isCurrentUserAdmin}
        />
      )}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        groupId={groupId}
        currentMemberIds={initialMembers.map(m => m.id)} 
      />
    </div>
  );
}