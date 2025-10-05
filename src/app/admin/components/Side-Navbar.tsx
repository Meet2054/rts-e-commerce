'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/firebase-auth';
import {
  Home,
  BarChart2,
  FileText,
  Users,
  Bell,
  LogOut,
  Activity
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', href: '/admin', icon: <Home size={20} /> },
  { name: 'Products', href: '/admin/products', icon: <BarChart2 size={20} /> },
  { name: 'Orders', href: '/admin/orders', icon: <BarChart2 size={20} /> },
  { name: 'Reports List', href: '/admin/report-list', icon: <FileText size={20} /> },
  { name: 'User/Client', href: '/admin/client', icon: <Users size={20} /> },
  { name: 'Analytics & Logs', href: '/admin/analytics', icon: <Activity size={20} /> },
  { name: 'Notification', href: '/admin/notification', icon: <Bell size={20} /> },
];

export default function SideNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
      } else {
        // Clear any local storage or session storage if needed
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        
        // Redirect to sign-in page
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-[300px] bg-white border-r z-40 flex flex-col pt-16">
      <nav className="flex-1 px-8 py-6 space-y-2">
        {navLinks.map(link => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center gap-3 py-2 text-sm text-gray-700 hover:text-[#2E318E] font-medium transition-colors"
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-8 pb-6">
        <button
          className="flex items-center gap-2 text-gray-700 hover:text-red-400 text-base cursor-pointer font-medium transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}

