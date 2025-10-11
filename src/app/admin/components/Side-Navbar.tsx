'use client';
import React, { useState, useEffect } from 'react';
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
  Activity,
  ChevronRight,
  ChevronLeft,
  BadgeDollarSign 
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', href: '/admin', icon: <Home size={20} /> },
  { name: 'Products', href: '/admin/products', icon: <BarChart2 size={20} /> },
  { name: 'Orders', href: '/admin/orders', icon: <BarChart2 size={20} /> },
  { name: 'Reports List', href: '/admin/report-list', icon: <FileText size={20} /> },
  { name: 'User/Client', href: '/admin/client', icon: <Users size={20} /> },
  { name: 'Custom Pricing', href: '/admin/custom-pricing', icon: <BadgeDollarSign  size={20} /> },
  { name: 'Notification', href: '/admin/notification', icon: <Bell size={20} /> },
  { name: 'Analytics & Logs', href: '/admin/analytics', icon: <Activity size={20} /> },
];

export default function SideNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const isLarge = window.innerWidth >= 1280; // xl breakpoint
      setIsLargeScreen(isLarge);
      if (isLarge) {
        setIsOpen(false); // Close mobile menu on large screens
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

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

  const handleLinkClick = () => {
    if (!isLargeScreen) {
      setIsOpen(false); // Close mobile menu when a link is clicked
    }
  };

  return (
    <>
      {/* Mobile Toggle Button - Only visible on LG and smaller screens */}
      {!isLargeScreen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-16 z-50 py-2 px-1 bg-gray-900 text-white mt-1 rounded-r-lg shadow-lg border xl:hidden"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      )}

      {/* Backdrop for mobile */}
      {!isLargeScreen && isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-xs z-30 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-[300px] bg-white border-r z-40 flex flex-col pt-16 transition-transform duration-300 ease-in-out ${
        isLargeScreen 
          ? 'translate-x-0' // Always visible on XL screens
          : isOpen 
            ? 'translate-x-0' // Visible when open on smaller screens
            : '-translate-x-full' // Hidden when closed on smaller screens
      }`}>
        <nav className="flex-1 px-8 py-6 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
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
    </>
  );
}

