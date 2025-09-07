'use client';
import React from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Image from 'next/image';

const Welcom = () => {
	const { user, userData, loading } = useAuth();
		const username = userData?.displayName || user?.email || 'Alex';

		// Loading state (optional)
		if (loading) {
			return (
				<div className="max-w-[1550px] mx-auto px-4 sm:px-16 py-8">
					<div className="h-24 bg-gray-100 rounded animate-pulse" />
				</div>
			);
		}

		return (
			<div className="max-w-[1550px] mx-auto px-4 sm:px-16 flex flex-col gap-6 py-3">
				{/* Logged-in Welcome */}
				{user && (
					<div className="flex items-center sm:justify-between bg-white rounded-xs shadow-sm p-4">
                        <div className='flex gap-4'>
                            <Image
                                src={'/login.png'}
                                alt={username}
                                width={55}
                                height={55}
                                className="rounded-full object-cover border border-gray-200"
                            />
                            <div className="font-semibold text-lg text-black flex items-center">
                                Hi {username}, <br /> Welcome Back 👋
                            </div>
                        </div>
							
						<div className="flex gap-4 items-center">
                            <div className="text-gray-600 max-w-md">
								As a valued returning customer, you qualify for special discounts and offers on your next purchase.
							</div>
							<button className="rounded-full flex items-center p-0.5 border h-7 w-7 border-black hover:bg-gray-200" title="Go">
								<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
							</button>
						</div>
					</div>
				)}
				{/* Guest Welcome */}
				{!user && (
                <div className="flex items-center sm:justify-between bg-white rounded-xs shadow-sm p-4">
                        <div className='flex gap-4'>
                            <Image
                                src={'/login.png'}
                                alt={username}
                                width={55}
                                height={55}
                                className="rounded-full object-cover border border-gray-200"
                            />
                            <div className="font-semibold text-lg text-black flex items-center">
                                Hi There, <br /> Welcome to RTS Imaging 👋
                            </div>
                        </div>
							
						<div className="flex gap-4 items-center">
                            <div className="text-gray-600 max-w-md">
                              Returning customers enjoy exclusive discounts! Log in to see your special pricing.							</div>
							<button className="rounded-full flex items-center p-0.5 border h-7 w-7 border-black hover:bg-gray-200" title="Go">
								<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
							</button>
						</div>
					</div>
				)}
			</div>
		);
};

export default Welcom;
