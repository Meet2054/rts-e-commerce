"use client";
import { useAuth } from "@/components/auth/auth-provider";
import { NotificationProvider } from "@/components/admin/notification-provider";
import AdminHeader from "./components/Admin-header";
import SideNavbar from "./components/Side-Navbar";

import React, { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const { userData, loading: authLoading, user } = useAuth();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isSmallScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F1F2F4]">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-black">Desktop Required</h2>
          <p className="text-gray-700 text-lg mb-2">Please use a desktop or laptop with a screen width of at least 1280px for the best admin panel experience.</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600">🔄 Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!userData || userData.role !== 'admin' && userData.role !== 'employee') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">🚫 You need admin access to view this panel.</p>
          <p className="text-sm text-red-500 mt-1">
            Current user: {user?.email} (Role: {userData?.role || 'none'})
          </p>
          <p className="text-sm text-red-500">
            To get admin access, manually change your role to 'admin' in Firebase Console → Firestore → users → your document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="bg-[#F1F2F4] min-h-screen">
        <SideNavbar />
        <AdminHeader />
        <main className="ml-[300px] mt-[64px]">
            {children}
        </main>
      </div>
    </NotificationProvider>
  );
}
