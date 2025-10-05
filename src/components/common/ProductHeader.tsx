'use client';

import React, { useState, useRef, useEffect} from 'react';
import { ChevronDown, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Comprehensive mega menu data structure
const megaMenuData = {
  'Ink & Toner': {
    sections: [
      {
        title: 'Ink & Toner',
        items: [
          'Brother', 'Canon', 'Citizen', 'Dell', 'Dymo', 'Epson', 'Fuji Xerox', 
          'Fujifilm', 'HP'
        ]
      },
      {
        title: 'Ink & Toner',
        items: [
          'Konica Minolta', 'Kyocera', 'Lanier', 'Lexmark', 
          'OKI', 'Panasonic', 'Pantum', 'Ricoh', 'Samsung'
        ]
      },
      {
        title: 'Ink & Toner',
        items: [
          'Sawgrass', 'Sharp', 'Star Micronics', 'Toshiba', 'Brady'
        ]
      }
    ],
    featured: {
      image: '/hero1.png',
      title: 'Ink & Toner',
      description: 'Premium ink and toner cartridges'
    }
  },
  'Printers': {
    sections: [
      {
        title: 'Printers',
        items: [
          'All Printers', 'Laser Printers', 'Inkjet Printers', 'Label Makers',
          'Colour Label Printers', 'Direct Thermal Label Printers',
          'Thermal Transfer Printers & Supplies', 'Thermal Receipt Printers',
          'ID Card Printers & Supplies', '3D Printers', 'Handheld Label Printers',
          'Portable Printers', 'Dot Matrix Printers', 'Wide Format & Large Format Printers'
        ]
      },
      {
        title: 'Shredders',
        items: [
          'Paper Shredders', 'Rexel Shredders', 'Fellowes Shredders', 'Cardboard Shredders'
        ]
      },
      {
        title: 'Scanners',
        items: [
          'Document Scanners', 'Flatbed Scanners', 'Portable Scanners',
          'Photo Scanners', 'Film Scanners', 'Barcode Scanners'
        ]
      },
      {
        title: 'Wide Format',
        items: [
          'Wide Format Printers', 'Wide Format Paper'
        ]
      }
    ],
    featured: {
      image: '/hero2.png',
      title: 'NEW Pantum Printers',
      description: 'Latest printer technology'
    }
  },
  '3D Printing': {
    sections: [
      {
        title: 'Filaments',
        items: [
          'PLA / PLA+', 'Silk PLA+', 'PETG', 'ABS', 'TPU', 'Nylon', 'PVA', 'ASA', 'Resins'
        ]
      },
      {
        title: 'Brands',
        items: [
          'Creality', 'Flashforge', 'Bambu Lab'
        ]
      },
      {
        title: '3D Printers',
        items: [
          '3D Printers', '3D Pens & Supplies', 'Accessories'
        ]
      }
    ],
    featured: {
      image: '/hero3.png',
      title: '3D Printers',
      description: 'Advanced 3D printing solutions'
    }
  },
  'Labels': {
    sections: [
      {
        title: 'Thermal Label Supplies',
        items: [
          'Direct Thermal Labels', 'Thermal Transfer Labels & Ribbons', 'Courier & Logistic Labels'
        ]
      },
      {
        title: 'Label Makers & Supplies',
        items: [
          'Label Makers', 'Brother Label Tapes', 'DYMO Label Tapes', 'Brady Label Tapes'
        ]
      },
      {
        title: 'A4 Label Sheets',
        items: [
          'A4 Address & Shipping Labels'
        ]
      },
      {
        title: 'Colour Labels',
        items: [
          'Inkjet Label Rolls', 'Laser Label Rolls'
        ]
      }
    ],
    featured: {
      image: '/hero4.png',
      title: 'Label Solutions',
      description: 'Complete labeling systems'
    }
  },
  'Warehouse Supplies': {
    sections: [
      {
        title: 'Mailing Products',
        items: [
          'Mailing Boxes', 'Poly Mailers', 'Bubble Padded Mailers',
          'Envelopes & Rigid Mailers', 'Doculopes'
        ]
      },
      {
        title: 'Packaging Materials',
        items: [
          'Packaging Tapes', 'Stretch Films', 'Protective Packaging', 'Strapping Solutions'
        ]
      },
      {
        title: 'Other Warehouse Supplies',
        items: [
          'Barcode Scanners', 'Price Guns & Labels', 'Postal Scales',
          'Knives & Cutters', 'Personal Protection (PPE)', 'Bin Liners & Garbage Bags',
          'Paper Tissues & Towels'
        ]
      },
      {
        title: 'Shipping Labels',
        items: [
          'Thermal Shipping Label Printers', 'Thermal Label Rolls',
          'Shipping & Courier Labels', 'A4 Label Sheets'
        ]
      },
      {
        title: 'Receipt Printing',
        items: [
          'Receipt Printers', 'Receipt Paper Rolls', 'Cash Registers',
          'Bond Paper', 'Cash Registers'
        ]
      }
    ],
    featured: {
      image: '/product.png',
      title: 'Warehouse & Retail',
      description: 'Complete warehouse solutions'
    }
  },
  'Office Supplies': {
    sections: [
      {
        title: 'Office Basics',
        items: [
          'Whiteboards & Accessories', 'Writing & Correction', 'Envelopes',
          'Glues, Tapes & Adhesives', 'Paper Trimmers & Guillotines',
          'Rubber Stamps', 'Scissors & Cutting', 'Software', 'Staplers & Punchers', 'Sticky Notes'
        ]
      },
      {
        title: 'Paper Supplies',
        items: [
          'A4 Copy Paper', 'Photo Paper', 'Wide Format Paper',
          'Thermal Receipt Paper', 'Bond Paper', 'Cash Registers'
        ]
      },
      {
        title: 'Cables',
        items: [
          'Phone Cables & Chargers', 'USB Hubs & Docking Stations',
          'HDMI & Display Cables', 'Networking & Wireless',
          'Powerboards & Surge Protection', 'Audio Cables',
          'Computer USB Cables', 'Power Cables', 'Mounts & Brackets',
          'Computer Accessories'
        ]
      }
    ],
    featured: {
      image: '/katun.svg',
      title: 'Office Solutions',
      description: 'Everything for your office'
    }
  }
};

const categories = [
  { label: 'Ink & Toner' },
  { label: 'Printers' },
  { label: '3D Printing' },
  { label: 'Labels' },
  { label: 'Warehouse Supplies' },
  { label: 'Office Supplies' },
];

export default function ProductHeader() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle mouse enter with delay
  const handleMouseEnter = (menuLabel: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setActiveMenu(menuLabel);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
    }, 150); // Small delay to prevent flickering
    setHoverTimeout(timeout);
  };

  // Clear timeout on mouse enter back to menu
  const handleMenuMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };

  // Handle mobile/tablet click toggle
  const handleMobileToggle = (menuLabel: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (activeMenu === menuLabel) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuLabel);
    }
  };

  // Navigate to products page with filters
  const handleNavigateToProducts = (filter?: string, filterType: 'oem' | 'productType' = 'oem') => {
    if (filter) {
      const params = new URLSearchParams();
      params.set(filterType, filter);
      router.push(`/products?${params.toString()}`);
    } else {
      router.push('/products');
    }
    setActiveMenu(null);
  };

  // Close mega menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRefs.current.every(ref => !ref || !ref.contains(e.target as Node))
      ) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Handle screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  return (
    <div className="bg-white shadow-sm mt-40 xl:mt-3 mb-2">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 flex justify-between items-start xl:items-center py-2">
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-16 w-full xl:w-auto">
          {categories.map((cat, idx) => (
            <div 
              key={cat.label + '-' + idx} 
              className="relative w-full xl:w-auto" 
              ref={el => { dropdownRefs.current[idx] = el; }}
              onMouseEnter={() => isDesktop && handleMouseEnter(cat.label)}
              onMouseLeave={() => isDesktop && handleMouseLeave()}
            >
              <button
                className="py-2 text-base text-black font-medium rounded hover:text-blue-400 cursor-pointer flex items-center justify-between xl:justify-start gap-1 w-full xl:w-auto border-b xl:border-b-0 border-gray-200 xl:border-none"
                onClick={(e) => {
                  if (!isDesktop) {
                    // Mobile/Tablet: Toggle dropdown
                    handleMobileToggle(cat.label, e);
                  } else {
                    // Desktop: Navigate to products
                    handleNavigateToProducts();
                  }
                }}
              >
                {cat.label}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  activeMenu === cat.label ? 'rotate-180' : ''
                }`} />
              </button>
              
              {/* Mega Menu - Desktop Only */}
              {activeMenu === cat.label && megaMenuData[cat.label as keyof typeof megaMenuData] && (
                <div 
                  className="hidden xl:block absolute top-full mt-2 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-lg z-50 p-6 min-w-[1000px] max-w-[1600px] border border-gray-100"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    left: idx > 2 ? '-50%' : '0',
                    transform: idx > 2 ? 'translateX(-50%)' : 'translateX(0)',
                  }}
                >
                  <div className="grid grid-cols-12 gap-6">
                    {/* Menu Sections */}
                    <div className="col-span-9">
                      <div className="flex flex-wrap gap-x-8 gap-y-6">
                        {megaMenuData[cat.label as keyof typeof megaMenuData].sections.map((section, sectionIdx) => (
                          <div key={sectionIdx} className="min-w-[180px] space-y-3">
                            {section.title && (
                              <h3 className="text-base font-semibold text-blue-600 border-b border-gray-200 pb-2 whitespace-nowrap">
                                {section.title}
                              </h3>
                            )}
                            <div className="space-y-1">
                              {section.items.map((item, itemIdx) => (
                                <button
                                  key={itemIdx}
                                  className="block text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded-md text-left w-full transition-colors duration-150 whitespace-nowrap"
                                  onClick={() => handleNavigateToProducts(item, 'oem')}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Featured Section */}
                    <div className="col-span-3">
                      <div className="p-4 rounded-lg h-full">
                        <div className="text-center h-full flex flex-col justify-between">
                          <div>
                            <Image 
                              src={megaMenuData[cat.label as keyof typeof megaMenuData].featured.image} 
                              alt={megaMenuData[cat.label as keyof typeof megaMenuData].featured.title}
                              width={200}
                              height={120}
                              className="w-full h-28 object-contain mb-3"
                            />
                            <h4 className="font-bold text-lg text-gray-800 mb-2">
                              {megaMenuData[cat.label as keyof typeof megaMenuData].featured.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                              {megaMenuData[cat.label as keyof typeof megaMenuData].featured.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile/Tablet Sliding Dropdown */}
              <div className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                activeMenu === cat.label ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="bg-gray-50 rounded-lg mt-2 p-4 border border-gray-200 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-blue-600 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10">
                      {cat.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      {megaMenuData[cat.label as keyof typeof megaMenuData]?.sections.map((section) => 
                        section.items
                      ).flat().map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          className="block text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-100 px-3 py-0.5 rounded-md text-left transition-colors duration-150 border border-transparent hover:border-blue-200"
                          onClick={() => handleNavigateToProducts(item, 'oem')}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
