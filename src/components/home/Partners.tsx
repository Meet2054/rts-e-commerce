"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Partners = () => {
  const router = useRouter();

  // Mapping of image numbers to company names (OEM values)
  const partnerMapping = {
    1: 'Brother',
    2: 'Kyocera', 
    3: 'Canon',
    4: 'OKI',
    5: 'Epson',
    6: 'Lexmark',
    7: 'DYMO',
    8: 'Dell',
    9: 'Hewlett Packard',
    10: 'Konica Minolta',
    11: 'FUJIFILM',
    12: 'Xerox'
  };

  // Handle partner logo click
  const handlePartnerClick = (imageNumber: number) => {
    const companyName = partnerMapping[imageNumber as keyof typeof partnerMapping];
    console.log('Clicked partner:', imageNumber, 'Company name:', companyName);
    
    if (companyName) {
      // Navigate to products page with OEM filter
      const url = `/products?oem=${encodeURIComponent(companyName)}`;
      console.log('Navigating to:', url);
      router.push(url);
    }
  };

  return (
    <section className="w-full pt-4 md:pt-10 xl:pt-0 flex justify-center">
      <div className="relative max-w-[1550px] mx-auto w-full h-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex flex-col py-0 xl:py-12 ">
        {/* Section Title */}
        <div className="mb-8 border-l-8 border-[#2E318E] flex items-center p-0.5 pl-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 ">
            Printer Inks and Toners
          </h2>
        </div>

        {/* Partners Grid - Dynamic Layout */}
        <div className="space-y-4">
          {/* First Row - Left aligned */}
          <div className="flex justify-between">
            {[1, 2, 3].map((imageNumber) => (
              <div 
                key={imageNumber}
                className="flex w-1/3 items-center cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => handlePartnerClick(imageNumber)}
              >
                <Image
                  src={`/partners/${imageNumber}.png`}
                  alt={`${partnerMapping[imageNumber as keyof typeof partnerMapping]} Logo`}
                  width={200}
                  height={60}
                  className="object-contain w-1/2 px-2"
                />
              </div>
            ))}
          </div>

          {/* Second Row - Right aligned with offset */}
          <div className="flex justify-between -mt-12">
            {[4, 5, 6].map((imageNumber) => (
              <div 
                key={imageNumber}
                className="flex w-1/3 justify-end items-center cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => handlePartnerClick(imageNumber)}
              >
                <Image
                  src={`/partners/${imageNumber}.png`}
                  alt={`${partnerMapping[imageNumber as keyof typeof partnerMapping]} Logo`}
                  width={200}
                  height={60}
                  className="object-contain w-1/2 px-2"
                />
              </div>
            ))}
          </div>

          {/* Third Row - Left aligned */}
          <div className="flex justify-between mt-4">
            {[7, 8, 9].map((imageNumber) => (
              <div 
                key={imageNumber}
                className="flex w-1/3 items-center cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => handlePartnerClick(imageNumber)}
              >
                <Image
                  src={`/partners/${imageNumber}.png`}
                  alt={`${partnerMapping[imageNumber as keyof typeof partnerMapping]} Logo`}
                  width={200}
                  height={60}
                  className="object-contain w-1/2 px-2"
                />
              </div>
            ))}
          </div>

          {/* Fourth Row - Right aligned with offset */}
          <div className="flex justify-between -mt-12">
            {[10, 11, 12].map((imageNumber) => (
              <div 
                key={imageNumber}
                className="flex w-1/3 justify-end items-center cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => handlePartnerClick(imageNumber)}
              >
                <Image
                  src={`/partners/${imageNumber}.png`}
                  alt={`${partnerMapping[imageNumber as keyof typeof partnerMapping]} Logo`}
                  width={200}
                  height={60}
                  className="object-contain w-1/2 px-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
