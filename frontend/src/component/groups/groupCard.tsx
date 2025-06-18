'use client';

import { Group } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/component/ui/card'; // Assicurati di avere questo componente
import Link from 'next/link';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    // Avvolgiamo la card in un Link per renderla navigabile in futuro
    <Link href={`/groups/${group.id}`} className="block">
      <Card className="hover:shadow-lg hover:border-blue-500 transition-all duration-200 h-full">
        <CardHeader>
          <CardTitle className="text-gray-800">{group.group_name}</CardTitle>
          {group.desc && (
            <CardDescription className="pt-1">{group.desc}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Creato il: {new Date(group.creation_date).toLocaleDateString('it-IT')}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}