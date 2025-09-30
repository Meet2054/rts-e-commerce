'use client';
import React from 'react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Mail, Bell, CircleUserRound, Link, LogOut, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase-auth';
import { useRouter } from 'next/navigation';


export default function AdminHeader() {

    const { userData, isAdmin } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter()

    const handleSignOut = async () => {
      try {
        await signOut();
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };
  
  return (
    <header className="fixed top-0 w-full py-2 bg-white shadow-sm z-50">
      <div className="px-8 sm:px-10 mx-auto flex items-center justify-between h-full">
        {/* Left: Logo & Tagline */}
        <Image src="/logo.svg" alt="RTS Imaging" width={200} height={40} />
        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center px-8">
          <input
            type="text"
            placeholder="Type to search"
            className="w-full max-w-3xl px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E318E] transition"
          />
        </div>
        {/* Right: Icons & Avatar */}
        <div className="flex items-center gap-6">
          {/* Mail Icon with badge */}
          <div className="relative">
            <Mail className="w-6 h-6 text-black" />
            <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full px-1.5 py-0.5">
              2
            </span>
          </div>
          {/* Notification Icon */}
          <Bell className="w-6 h-6 text-black" />
          
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
                        {userData?.displayName}
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
        </div>
      </div>
    </header>
  );
}
