import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import AdminDashboard from '../../../../components/coustom-ui/admin-dashboard';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
}