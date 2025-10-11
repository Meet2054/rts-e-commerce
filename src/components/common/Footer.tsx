'use client';
import React from 'react';
import Image from 'next/image';

const companyLinks = [
    { name: 'Products', href: '/products' },
    { name: 'Customer Support', href: '/support' },
    { name: 'Terms & Conditions', href: '/terms-conditions' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
];

const popularLinks = [
    { name: 'HP Ink Cartridges', href: '/products?brand=HP' },
    { name: 'Epson Ink Cartridges', href: '/products?brand=Epson' },
    { name: 'Label Makers & Printers', href: '/products?category=Label%20Makers' },
    { name: 'Warehouse Supplies', href: '/products?category=Warehouse' },
];

const Footer = () => {
    return (
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 pt-10 pb-3 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row w-full justify-between py-10 lg:py-12 gap-14">
                {/* Logo & Description */}
                <div className="flex flex-col gap-5 max-w-xs">
                    <Image 
                        src="/logo.svg" 
                        alt="RTS Imaging" 
                        width={200} 
                        height={100} 
                    />
                    <div className="text-base text-black">
                        RTS Imaging B2B Marketplace<br />
                        Your trusted partner for printers, inks, and toners.<br />
                        Supplying businesses with reliable products and seamless order support.
                    </div>
                </div>
                {/* Company */}
                <div className='grid grid-cols-2 gap-10'>
                <div>
                    <div className="text-sm font-bold text-black mb-3 tracking-widest">COMPANY</div>
                    <ul className="space-y-2">
                        {companyLinks.map(link => (
                            <li key={link.name}>
                                <a href={link.href} className="text-sm text-gray-700 hover:text-[#2E318E] font-medium transition-colors">{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Popular Products */}
                <div>
                    <div className="text-sm font-bold text-black mb-3 tracking-widest">POPULAR PRODUCTS</div>
                    <ul className="space-y-2">
                        {popularLinks.map(link => (
                            <li key={link.name}>
                                <a href={link.href} className="text-sm text-gray-700 hover:text-[#2E318E] font-medium transition-colors">{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            </div>
            <div className="h-0.5 bg-black/20 w-full"></div>
            <div className="flex justify-center items-center text-sm text-gray-700 py-2">
                <span>© 2025 RTS Imaging. All Rights Reserved.</span>
            </div>
        </div>
    );
};

export default Footer;
