'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Package, Home, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase-auth';
import Image from 'next/image';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/checkout', label: 'Cart', icon: ShoppingCart },
  ];

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-[1550px] mx-auto px-12 sm:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
             src="/logo.svg" 
             alt="RTS Logo" 
             width={200} 
             height={60} 
            />
          </Link>
          {/* If user is not logged in, show login/signup */}
          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-base font-medium text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg text-base font-semibold"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Search Bar */}
              <div className="hidden lg:block">
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="w-72 px-4 py-2 rounded-lg bg-[#F1F2F4] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Icons */}
              <Link href="/" className="p-2 rounded-lg hover:bg-gray-100">
                <Home className="h-6 w-6 text-gray-700" />
              </Link>
              <Link href="/products" className="p-2 rounded-lg hover:bg-gray-100">
                <Package className="h-6 w-6 text-gray-700" />
              </Link>
              <Link href="/checkout" className="p-2 rounded-lg hover:bg-gray-100">
                <ShoppingCart className="h-6 w-6 text-gray-700" />
              </Link>
              {/* Admin Link */}
              {userData?.role === 'admin' && (
                <Link href="/test-admin" className="p-2 rounded-lg hover:bg-purple-50">
                  <Settings className="h-6 w-6 text-purple-700" />
                </Link>
              )}
              {/* User Info Dropdown */}
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {userData?.displayName || user.email}
                </span>
                {userData?.companyName && (
                  <span className="text-xs text-gray-500">{userData.companyName}</span>
                )}
                {userData?.role && (
                  <span className={`inline-block text-xs px-2 py-1 rounded ${
                    userData.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {userData.role}
                  </span>
                )}
              </div>
              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Sign Out"
              >
                <LogOut className="h-6 w-6 text-gray-700" />
              </button>
            </div>
          )}
        </div>
        {/* Mobile Navigation */}
        <div className="md:hidden mt-2">
          <div className="flex gap-2 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;