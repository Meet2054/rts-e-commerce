'use client';
import React from 'react';
import Image from 'next/image';
import { Mail, Bell } from 'lucide-react';

export default function AdminHeader() {
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
          {/* User Avatar */}
          <Image
            src=""
            alt="User"
            width={40}
            height={40}
            className="rounded-full bg-amber-600 border border-gray-300"
          />
        </div>
      </div>
    </header>
  );
}
