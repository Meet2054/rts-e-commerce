// src/app/orders/page.tsx
import React from 'react';
// import Header from "@/app/components/Header";
// import Footer from "@/app/components/Footer";
// import SubFooter from "@/app/components/SubFooter";
import OrdersList from "./components/OrdersList";

export default function OrdersPage() {
  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      
      <div className="min-h-screen">
        <div className="max-w-[1550px] px-4 md:px-12 lg:px-16 mx-auto py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track and manage your order history</p>
          </div>
          <OrdersList />
        </div>
      </div>
     
    </div>
  );
}
