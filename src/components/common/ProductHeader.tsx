'use client';

import React, { useState, useRef, useEffect} from 'react';
import { ChevronDown, ChevronRight, Phone, Mail } from 'lucide-react';

const inkTonerMenu = [
  {
    label: 'Printers',
    sub: [
      {
        label: 'All Printers',
        sub: [
          { label: 'Printer 1' },
          { label: 'Printer 2' },
          { label: 'Printer 3' },
          { label: 'Printer 4' },
          { label: 'Printer 5' },
          { label: 'Printer 6' },
          { label: 'Printer 7' },
        ],
      },
    ],
  },
  {
    label: 'Shedders',
  },
];

const categories = [
  { label: 'Ink & Toner' },
  { label: 'Printer' },
  { label: '3D Printer' },
  { label: 'Labels' },
  { label: 'Ware House Supplies' },
  { label: 'Office Supply' },
];

const Dropdown ="px-2 py-1 text-base cursor-pointer rounded-md text-black font-medium hover:bg-[#F0F5FF]";


export default function ProductHeader() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [subOpenIdx, setSubOpenIdx] = useState<number | null>(null);
  const [subSubOpenIdx, setSubSubOpenIdx] = useState<number | null>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRefs.current.every(ref => !ref || !ref.contains(e.target as Node))
      ) {
        setOpenIdx(null);
        setSubOpenIdx(null);
        setSubSubOpenIdx(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <div className="bg-white shadow-sm mt-40 xl:mt-3 mb-2">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex justify-between items-center py-2">
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-16">
          {categories.map((cat, idx) => (
            <div key={cat.label + '-' + idx} className="relative" ref={el => { dropdownRefs.current[idx] = el; }}>
              <button
                className="py-2 text-base text-black font-medium rounded hover:text-blue-400 cursor-pointer flex items-center gap-1"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                {cat.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              {/* Dropdown: all categories open the same menu */}
              {openIdx === idx && (
                <div className="absolute left-0 top-full mt-2 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] rounded-md z-50 w-48 px-1 py-1">
                  {inkTonerMenu.map((sub, subIdx) => (
                    <div key={sub.label} className="relative">
                      <button
                        className={`${Dropdown} w-full flex justify-between items-center ${subOpenIdx === subIdx ? 'bg-[#F0F5FF]' : ''}`}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F5FF')}
                        onMouseLeave={e => {
                          if (subOpenIdx !== subIdx) e.currentTarget.style.background = '';
                        }}
                        onClick={() => setSubOpenIdx(subOpenIdx === subIdx ? null : subIdx)}
                      >
                        {sub.label}
                        {sub.sub && <ChevronRight className="h-4 w-4" />}
                      </button>
                      {/* Sub Dropdown */}
                      {subOpenIdx === subIdx && sub.sub && (
                        <div className="absolute left-full ml-3 top-0 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] rounded-md z-50 w-48 px-1 py-1 ">
                          {sub.sub.map((subsub, subSubIdx) => (
                            <React.Fragment key={subsub.label}>
                              <button
                                className={`${Dropdown} w-full flex justify-between items-center ${subSubOpenIdx === subSubIdx ? 'bg-[#F0F5FF]' : ''}`}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F5FF')}
                                onMouseLeave={e => {
                                  if (subSubOpenIdx !== subSubIdx) e.currentTarget.style.background = '';
                                }}
                                onClick={() => setSubSubOpenIdx(subSubOpenIdx === subSubIdx ? null : subSubIdx)}
                              >
                                {subsub.label}
                                {subsub.sub && <ChevronRight className="h-4 w-4" />}
                              </button>
                              {/* Printer list opens below All Printers */}
                              {subSubOpenIdx === subSubIdx && subsub.sub && (
                                <div className="w-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.12)] rounded-md z-50 px-1 py-1 mt-1">
                                  {subsub.sub.map((printer) => (
                                    <button
                                      key={printer.label}
                                      className={`${Dropdown} w-full flex justify-between items-center`}
                                      onMouseEnter={e => (e.currentTarget.style.background = '#F0F5FF')}
                                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                      {printer.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className='flex-col hidden xl:flex gap-1 text-sm text-gray-800 items-end'>
          <a href="tel:+918401926641" className='flex gap-2'>+91 8401926641 <Phone size={20} className='text-blue-800' /></a>
          <a href="mailto:rtsimaging@support.com" className='flex gap-2'>rtsimaging@support.com <Mail size={20} className='text-blue-800' /></a>
        </div>
      </div>
    </div>
  );
}
