'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { ProcessedMember } from '@/types';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import MemberDetailModal from './memberDetailModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
      <div className="w-full flex items-stretch text-left">
        <button
          onClick={() => onAdminActionsClick(member)}
          disabled={isSelf}
          className="flex-grow p-4 flex items-center justify-start gap-2 hover:bg-gray-50 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="font-medium text-gray-900">{member.username}</span>
          {isSelf && <span className="font-normal text-blue-600">(Tu)</span>}
          {member.isAdmin && <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full">Admin</span>}
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 w-48 p-4 flex flex-col items-end justify-center hover:bg-gray-50 transition-colors border-l border-gray-200"
        >
          {Math.abs(balance) < 0.01 ? (
            <p className="text-gray-500 font-medium">In pari</p>
          ) : (
            <>
              <p className={`font-bold text-lg ${balanceColor}`}>
                {Math.abs(balance).toFixed(2)} €
              </p>
              <p className={`text-xs ${balanceColor}`}>
                {balance > 0 ? 'Deve ricevere' : 'Deve dare'}
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<ProcessedMember | null>(null);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),
    onSuccess: () => {
      alert('Invito inviato con successo!'); 
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['group-details-simplified', groupId] });
    },
    onError: (error) => {
      alert(`Errore nell'invio dell'invito: ${error.message}`);
    }
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail.trim());
  };

  return (
    <div className="space-y-8">   
      {isCurrentUserAdmin && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Invita un nuovo membro</h3>
          <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input 
              type="email" 
              placeholder="email@esempio.com" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full text-gray-500" 
              disabled={inviteMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={inviteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {inviteMutation.isPending ? 'Invio...' : 'Invia Invito'}
            </Button>
          </form>
        </div>
      )}

       <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Panoramica Saldi Membri</h3>
        <ul className="space-y-3">
          {initialMembers.map(member => (
            <MemberRow
                key={member.id}
                member={member}
                onAdminActionsClick={setSelectedMember}
            />
          ))}
        </ul>
      </div>

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          groupId={groupId}
          onClose={() => setSelectedMember(null)}
          isCurrentUserAdmin={isCurrentUserAdmin}
        />
      )}
    </div>
  );
}