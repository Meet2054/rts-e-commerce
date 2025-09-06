
'use client';
import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react';

const socialLinks = [
	{ href: 'https://instagram.com', icon: <Instagram size={22} /> },
	{ href: 'https://facebook.com', icon: <Facebook size={22} /> },
	{ href: 'https://twitter.com', icon: <Twitter size={22} /> },
	{ href: 'https://youtube.com', icon: <Youtube size={22} /> },
	{ href: 'https://linkedin.com', icon: <Linkedin size={22} /> },
];

const navLinks = [
	{ href: '/download', label: 'Download App' },
	{ href: '/about', label: 'About' },
	{ href: '/products', label: 'Product' },
	{ href: '/partner', label: 'Partner' },
	{ href: '/safety', label: 'Safety' },
	{ href: '/jobs', label: 'Jobs' },
	{ href: '/help', label: 'Get help' },
];

const Footer = () => {
	return (
        <div className="max-w-[1550px] mx-auto mb-3 px-4 sm:px-16 flex flex-col items-center justify-between">
            <div className='h-0.5 bg-black/40 w-full'></div>
            
            <div className='flex flex-col md:flex-row w-full items-center justify-between py-5 gap-6'>
                {/* Left: Social Icons */}
                <div className="flex items-center gap-5">
                    {socialLinks.map((item, idx) => (
                        <a key={idx} href={item.href} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-black">
                            {item.icon}
                        </a>
                    ))}
                </div>
                {/* Center: Navigation Links */}
                <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
                    {navLinks.map((item) => (
                        <Link key={item.href} href={item.href} className="hover:text-black">
                            {item.label}
                        </Link>
                    ))}
                </div>
                {/* Right: Copyright */}
                <div className="text-right text-xs text-gray-700 leading-tight">
                    <div>Proudly created in India.</div>
                    <div>All Right Reserved, All Wrong Reversed.</div>
                </div>
            </div>
        </div>
	);
};

export default Footer;
