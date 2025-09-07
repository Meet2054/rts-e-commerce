'use client';
import React from 'react';
import Image from 'next/image';

const Categories = () => {
	return (
		<div className="max-w-[1550px] mx-auto px-4 sm:px-16 mt-6 py-2">
			<h2 className="text-xl font-bold text-black mb-6">Shop by Categories</h2>
			<div className="flex flex-col md:flex-row gap-6 mb-6">
				{/* Katun Card */}
				<Image src="/image1.svg" alt="Katun" width={1500} height={300} className=" w-full md:w-1/2" />
					
				{/* Static Control Card */}
				<Image src="/image2.svg" alt="Static Control" width={1500} height={300} className=" w-full md:w-1/2" />
			</div>
		</div>
	);
};

export default Categories;
