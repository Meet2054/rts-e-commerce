'use client';
import React from 'react';
import Image from 'next/image';

const SubFooter = () => {
    return (
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 xl:mt-6 py-2">
            {/* Partner Account Card */}
            <div className="w-full rounded-lg overflow-hidden relative h-52 sm:h-72 xl:h-96 flex items-center bg-[#232C18]">
                <Image src="/image3.svg" alt="Partner" width={1500} height={300} className="opacity-70 object-cover w-full h-full" />
                <div className="absolute left-6 md:left-12 z-10">
                    <div className="text-white text-xl md:text-4xl lg:text-[44px] font-semibold mb-4 leading-snug">
                        Join the many businesses<br />
                        that rely on RTS Imaging<br />
                        for quality, service, and support.
                    </div>
                    <button className="bg-white text-black font-semibold px-10 py-2 lg:py-3 rounded">Request a Partner Account</button>
                </div>
            </div>
        </div>
    );
};

export default SubFooter;
