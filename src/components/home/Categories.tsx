'use client';
import React from 'react';
import Image from 'next/image';

const Categories = () => {
	return (
		<div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 mt-6 py-2">
			<h2 className="text-2xl font-bold border-l-8 border-[#2E318E] p-0.5 pl-4 text-black mb-10">Shop by Categories</h2>
			<div className="flex flex-col md:flex-row gap-2 xl:gap-6 mb-0 xl:mb-6">
				{/* Katun Card */}
				<Image src="/image1.svg" alt="Katun" width={1500} height={300} className=" w-full md:w-1/2" />
					
				{/* Static Control Card */}
				<Image src="/image2.svg" alt="Static Control" width={1500} height={300} className=" w-full md:w-1/2" />
			</div>
		</div>
	);
};

export default Categories;
