
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tally3, Search, ShoppingCart, Boxes, ListOrdered, FileText, ShieldCheck, Headphones, LayoutDashboard, LogIn, UserPlus, X } from 'lucide-react';
import { useCartSummary } from '@/hooks/use-cart';
import { useAuth } from '@/components/auth/auth-provider';
import SearchDropdown from './SearchDropdown';
import { AnimatePresence, motion } from 'framer-motion';

export default function MobileHeader() {
	const { user, userData, isAdmin } = useAuth();
    const { itemCount } = useCartSummary();
	const [showDropdown, setShowDropdown] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
	const [showHeader, setShowHeader] = useState(true);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const lastScrollY = useRef(0);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		}
		if (showDropdown) {
			document.addEventListener('mousedown', handleClick);
		}
		return () => {
			document.removeEventListener('mousedown', handleClick);
		};
	}, [showDropdown]);

	useEffect(() => {
		function handleScroll() {
			const currentY = window.scrollY;
			if (currentY > lastScrollY.current && currentY > 50) {
				setShowHeader(false); // scrolling up, hide
			} else {
				setShowHeader(true); // scrolling down, show
			}
			lastScrollY.current = currentY;
		}
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<header className={`fixed top-0 z-50 w-full bg-[#F1F2F4] shadow-sm flex flex-col gap-2 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
			<div className="flex items-center bg-white justify-between px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-4">
				<div className='flex items-center justify-between w-full md:w-auto gap-4 relative'>
					<button onClick={() => setShowDropdown((prev) => !prev)}>
						{showDropdown ? (
							<X size={32} className="text-black" />
						) : (
							<Tally3 size={32} className="text-black rotate-90" />
						)}
					</button>
					{/* Dropdown menu */}
					{showDropdown && (
						<div ref={dropdownRef} className="absolute left-0 top-12 w-[260px] bg-white shadow-lg rounded-xl z-50 py-3 px-2 flex flex-col gap-1 border border-gray-100">
							{/* User info or sign in/up */}
							<div className="mb-2">
								{user ? (
									<>
										<span className="block text-base font-semibold text-gray-900 mb-1">{userData?.displayName || user.email}</span>
										{userData?.companyName && (
											<span className="block text-xs text-gray-500 mb-2">{userData.companyName}</span>
										)}
									</>
								) : (
									<div className="flex gap-2 mb-2">
										<Link href="/sign-in" className="flex items-center gap-1 px-3 py-1 rounded bg-[#F0F5FF] text-blue-700 font-medium text-sm">
											<LogIn size={16} /> Sign In
										</Link>
										<Link href="/sign-up" className="flex items-center gap-1 px-3 py-1 rounded bg-[#F0F5FF] text-green-700 font-medium text-sm">
											<UserPlus size={16} /> Sign Up
										</Link>
									</div>
								)}
							</div>
							{/* Menu buttons */}
							<Link href="/products" className="flex items-center gap-2 px-4 py-2 rounded text-black font-medium hover:bg-[#F0F5FF]">
								<Boxes size={18} /> Products
							</Link>
							<Link href="/orders" className="flex items-center gap-2 px-4 py-2 rounded text-black font-medium hover:bg-[#F0F5FF]">
								<ListOrdered size={18} /> My Order
							</Link>
							<Link href="/terms-conditions" className="flex items-center gap-2 px-4 py-2 rounded text-black font-medium hover:bg-[#F0F5FF]">
								<FileText size={18} /> Term &amp; Condition
							</Link>
							<Link href="/privacy-policy" className="flex items-center gap-2 px-4 py-2 rounded text-black font-medium hover:bg-[#F0F5FF]">
								<ShieldCheck size={18} /> Privacy Policy
							</Link>
							<span className="flex items-center gap-2 px-4 py-2 rounded text-black font-medium hover:bg-[#F0F5FF] cursor-pointer">
								<Headphones size={18} /> 24 × 7 Customer Care
							</span>
							{isAdmin && (
								<Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded text-purple-700 font-medium hover:bg-purple-50">
									<LayoutDashboard size={18} /> Dashboard
								</Link>
							)}
						</div>
					)}
					<Image src="/logo.svg" alt="RTS Logo" width={170} height={32} />
				</div>
				<Image src="/logo2.svg" alt="Katun Logo" className='hidden md:block' width={100} height={32} />
				<Image src="/logo3.svg" alt="Katun Logo" className='hidden md:block' width={100} height={32} />
				<Image src="/logo4.svg" alt="Katun Logo" className='hidden md:block' width={100} height={32} />
			</div>
			{/* Search bar */}
			<div className="flex items-center justify-between bg-white px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 py-3">
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
                      <SearchDropdown onClose={() => setShowSearchDropdown(false)} />
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
				<Link href="/cart" className="p-2 rounded-lg hover:bg-gray-100 relative">
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
			</div>
		</header>
	);
}
