"use client";
import AdminHeader from "./components/Admin-header";
import SideNavbar from "./components/Side-Navbar";

import React, { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth < 1280);
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

  return (
    <div className="bg-[#F1F2F4] min-h-screen">
      <SideNavbar />
      <AdminHeader />
      <main className="ml-[300px] mt-[64px]">
          {children}
      </main>
    </div>
  );
}
