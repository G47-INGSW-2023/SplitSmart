'use client';

import { Group } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/component/ui/card'; // Assicurati di avere questo componente
import Link from 'next/link';

interface GroupCardProps {
  group: Group & { totalBalance: number };
}

export function GroupCard({ group }: GroupCardProps) {
  const balance = group.totalBalance;
  const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <Link href={`/groups/${group.id}`} className="block h-full">
      <Card className="hover:shadow-lg hover:border-blue-500 transition-all duration-200 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-gray-800">{group.group_name}</CardTitle>
          {group.desc && (
            <CardDescription className="pt-1">{group.desc}</CardDescription>
          )}
        </CardHeader>
         <CardContent className="mt-auto pt-4 border-t">
          <p className="text-xs text-gray-500">Il tuo saldo nel gruppo</p>
          <p className={`text-lg font-bold ${balanceColor}`}>
            {balance > 0 ? '+' : ''}{balance.toFixed(2)} €
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}