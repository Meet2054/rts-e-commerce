'use client';
import React from 'react';
import Image from 'next/image';

const SubFooter = () => {
    return (
        <div className="max-w-[1550px] mx-auto px-4 sm:px-16 mt-6 py-2">
            {/* Partner Account Card */}
            <div className="w-full rounded-lg overflow-hidden relative h-96 flex items-center bg-[#232C18]">
                <Image src="/image3.svg" alt="Partner" width={1500} height={300} className="opacity-70" />
                <div className="absolute left-6 md:left-12 z-10">
                    <div className="text-white text-2xl md:text-4xl lg:text-[44px] font-semibold mb-4 leading-snug">
                        Join the many businesses<br />
                        that rely on RTS Imaging<br />
                        for quality, service, and support.
                    </div>
                    <button className="bg-white text-black font-semibold px-10 py-3 rounded">Request a Partner Account</button>
                </div>
            </div>
            {/* Placeholder for additional content */}
            <Image src="/logo.svg" alt="Partner" width={1500} height={300} className="mt-16" />
        </div>
    );
};

export default SubFooter;
