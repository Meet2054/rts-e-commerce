'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, LogOut, Settings, CircleUserRound, EllipsisVertical, } from 'lucide-react';
import SearchDropdown from '../common/SearchDropdown';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase-auth';
import Image from 'next/image';

const Header = () => {
  const router = useRouter();
  const { user, userData, loading, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  const Dropdown ="px-5 py-2 text-base text-black font-medium hover:bg-[#F0F5FF]";

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node) &&
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setShowMenuDropdown(false);
      }
    }
    if (showDropdown || showMenuDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showDropdown, showMenuDropdown]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
      <div className="max-w-[1550px] mx-auto px-4 sm:px-16 py-2">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
             src="/logo.svg" 
             alt="RTS Logo" 
             width={300} 
             height={60} 
            />
          </Link>

          <Image 
             src="/logo2.svg" 
             alt="RTS Logo" 
             width={300} 
             height={60} 
            />
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
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center text-black gap-2 sm:gap-5 relative">
              {/* Search Bar */}
              <div className="flex items-center gap-2 relative">
                <button
                  className="flex items-center gap-2 text-xl hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowSearchDropdown(true)}
                  aria-label="Open search"
                >
                  <Search className="h-6 w-6" />
                  <span>Search</span>
                </button>
                <AnimatePresence>
                  {showSearchDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="fixed left-1/2 -translate-x-1/2 top-10 z-50 w-full flex justify-center"
                    >
                      <SearchDropdown />
                    </motion.div>
                  )}
                </AnimatePresence>
                {showSearchDropdown && (
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowSearchDropdown(false)}
                  />
                )}
              </div>
              {/* Icons */}
              {/* User Icon with Dropdown */}
              <div className="relative text-black" ref={userDropdownRef}>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => {
                    setShowDropdown((prev) => !prev);
                    setShowMenuDropdown(false);
                  }}
                  aria-label="User menu"
                >
                  <CircleUserRound className="h-6 w-6" />
                </button>
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-60 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] rounded-lg z-50 p-4 flex flex-col gap-2 border border-gray-100"
                    >
                      <span className="text-base font-semibold text-gray-900">
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
                      <hr className="my-2" />
                      
                      {/* Admin Dashboard Link */}
                      {isAdmin && (
                        <>
                          <Link 
                            href="/admin"
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <hr className="my-2" />
                        </>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link href="/cart" className="p-2 rounded-lg hover:bg-gray-100">
                <ShoppingCart className="h-6 w-6" />
              </Link>
              {/* Three-dot icon with dropdown */}
              <div className="relative" ref={menuDropdownRef}>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => {
                    setShowMenuDropdown((prev) => !prev);
                    setShowDropdown(false);
                  }}
                  aria-label="Menu"
                >
                  <EllipsisVertical className="h-6 w-6" />
                </button>
                <AnimatePresence>
                  {showMenuDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-60 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] rounded-lg z-50 py-3 px-2 flex flex-col gap-1 border border-gray-100"
                    >
                      <span className={`${Dropdown} cursor-pointer`}>24 × 7 Customer Care</span>
                      <Link href="/orders" className={Dropdown}>My Orders</Link>
                      <Link href="/terms" className={Dropdown}>Term &amp; Condition</Link>
                      <Link href="/privacy" className={Dropdown}>Privacy Policy</Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Admin Link */}
              {isAdmin && (
                <Link href="/admin" className="p-2 rounded-lg hover:bg-purple-50" title="Admin Dashboard">
                  <Settings className="h-6 w-6 text-purple-700" />
                </Link>
              )}
            </div>
          )}
        </div>
        
      </div>
    </nav>
  );
};

export default Header;