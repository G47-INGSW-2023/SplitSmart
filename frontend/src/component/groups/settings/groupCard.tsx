'use client';

import { Group } from '@/types';
import Link from 'next/link';

interface GroupCardProps {
  group: Group & { totalBalance: number };
}

export function GroupCard({ group }: GroupCardProps) {
  const balance = group.totalBalance;
  const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <Link href={`/groups/${group.id}`} className="block p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
      <div className="flex flex-row justify-between sm:items-center gap-2">
        <div>
          <p className="font-medium text-gray-800">
            {group.group_name}
          </p>
        </div>
        <div className={`text-right ${balanceColor}`}>
          <p className='text-sm'>{balance > 0 ? 'Ti devono' : 'Devi dare'}</p>
          <p className='font-semibold'>{Math.abs(balance).toFixed(2)} €</p>
        </div>
      </div>
    </Link>
  );
}