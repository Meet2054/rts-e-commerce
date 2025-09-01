'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Package, Home, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase-auth';

const Navigation = () => {
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B2B</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Store</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userData?.displayName || user.email}
                  </p>
                  {userData?.companyName && (
                    <p className="text-xs text-gray-500">{userData.companyName}</p>
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

                {/* Admin Link */}
                {userData?.role === 'admin' && (
                  <Link
                    href="/test-admin"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
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

export default Navigation;