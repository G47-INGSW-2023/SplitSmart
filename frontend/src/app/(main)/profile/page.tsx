'use client';

import { useAuth } from '@/lib/authContext';
import { Button } from '@/component/ui/button';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LogOut, User, Mail, Calendar } from 'lucide-react'; 

const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
        <div className="p-6 sm:p-8 bg-white rounded-lg shadow-md space-y-6">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="border-t my-4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

export default function ProfilePage() {
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['user-details', currentUser?.id],
    queryFn: () => api.getUserDetails(currentUser!.id),
    enabled: !!currentUser,
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading || !currentUser || !userDetails) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
          <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-1 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Il Tuo Profilo</h1>
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <User className="h-6 w-6 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Username</p>
              <p className="text-lg font-semibold text-gray-800">{userDetails.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t pt-6">
            <Mail className="h-6 w-6 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-800">{userDetails.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t pt-6">
            <Calendar className="h-6 w-6 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Membro dal</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(userDetails.registration_date).toLocaleDateString('it-IT', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Button 
          variant="destructive"
          onClick={handleLogout}
          className="w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}