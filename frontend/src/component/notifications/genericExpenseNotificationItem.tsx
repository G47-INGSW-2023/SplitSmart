'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Notific } from '@/types';
import Link from 'next/link';

interface GenericExpenseNotificationItemProps {
  notification: Notific;
  actionText: string;
  expenseName?: string;
}

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-1/2"></div>
    </div>
);
export default function GenericExpenseNotificationItem({ notification, actionText, expenseName }: GenericExpenseNotificationItemProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['generic-notification-details', notification.id],
    queryFn: async () => {
      const [group, actor] = await Promise.all([
        api.getGroupById(notification.group_id!),
        api.getUserDetails(notification.user_id!),
      ]);
      return { group, actor };
    },
    enabled: !!notification.group_id && !!notification.user_id,
  });

  if (isLoading || !data) {
    return <LoadingSkeleton />;
  }

  return (
    <Link href={`/groups/${notification.group_id}`} className="block">
      <p className="text-sm text-gray-800">
        <strong className="font-semibold">{data.actor.username}</strong>
        {` ${actionText} `}
        {expenseName && <strong className="font-semibold">"{expenseName}"</strong>}
        {` nel gruppo `}
        <strong className="font-semibold">"{data.group.group_name}"</strong>.
      </p>
    </Link>
  );
}