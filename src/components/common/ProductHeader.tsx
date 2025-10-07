'use client';

import React, { useState, useRef, useEffect} from 'react';
import { ChevronDown, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      },
      {
        title: '',
        items: [
        ]
      },
      {
        title: '',
        items: [
        ]
      }
    ],
  },
  'Printers': {
    sections: [
      {
        title: 'Printers',
        items: [
          'All Printers', 'Laser Printers', 'Inkjet Printers', 'Label Makers',
          'Colour Label Printers', 'Direct Thermal Label Printers',
          'Thermal Transfer Printers & Supplies', 
        ]
      },
      {
        title: 'Printers',
        items: [
           'Thermal Receipt Printers',
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
      },
      {
        title: '',
        items: [
        ]
      },
    ],
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
      },
      {
        title: '',
        items: [
        ]
      },
      {
        title: '',
        items: [
        ]
      }
    ],
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
      },
      {
        title: '',
        items: [
        ]
      }
    ],
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
        title: 'Warehouse Supplies',
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
      },
      {
        title: '',
        items: [
        ]
      },
      {
        title: '',
        items: [
        ]
      }
    ],
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

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
    }, 300); // Longer delay to allow mouse movement to mega menu
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
  const handleNavigateToProducts = (filter?: string, categoryLabel?: string) => {
    if (filter && categoryLabel) {
      const params = new URLSearchParams();
      
      // For Ink & Toner category, filter by OEM (brand names)
      if (categoryLabel === 'Ink & Toner') {
        params.set('oem', filter);
      } else {
        // For other categories, handle multi-word searches
        const keywords = filter.split(/\s+/).filter(word => word.length > 0);
        
        if (keywords.length > 1) {
          // For multi-word terms like "Photo Paper", search for the most specific keyword first
          // Usually the second word is more specific (e.g., "Paper" in "Photo Paper")
          const primaryKeyword = keywords[keywords.length - 1]; // Last word is usually most specific
          params.set('search', primaryKeyword);
          // Pass all keywords for frontend filtering
          params.set('keywords', keywords.join(','));
        } else {
          // For single words, use regular search
          params.set('search', filter);
        }
      }
      
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
              onMouseLeave={() => isDesktop && activeMenu !== cat.label && handleMouseLeave()}
            >
              <button
                className="py-2 text-base text-black font-medium rounded hover:text-blue-400 cursor-pointer flex items-center justify-between xl:justify-start gap-1 w-full xl:w-auto border-b xl:border-b-0 border-gray-200 xl:border-none"
                onClick={(e) => {
                  // Both Desktop and Mobile: Toggle dropdown with click
                  handleMobileToggle(cat.label, e);
                }}
              >
                {cat.label}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  activeMenu === cat.label ? 'rotate-180' : ''
                }`} />
              </button>
              
              {/* Mega Menu - Desktop Only */}
              {activeMenu && (
                <div 
                  className="hidden xl:block fixed left-0 top-44 w-full z-10"
                  onMouseEnter={handleMenuMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Invisible buffer zone to prevent menu switching */}
                  <div className="h-4 w-full" onMouseEnter={handleMenuMouseEnter}></div>
                  <div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 mt-3">
                    <div className="flex shadow-md border border-gray-200">
                      {megaMenuData[activeMenu as keyof typeof megaMenuData]?.sections.map((section, sectionIdx) => (
                        <div 
                          key={sectionIdx} 
                          className={`flex-1 p-6 border-r border-gray-200 last:border-r-0 ${
                            sectionIdx % 6 === 0 ? 'bg-white' :
                            sectionIdx % 6 === 1 ? 'bg-[#F6F6F6]' :
                            sectionIdx % 6 === 2 ? 'bg-white' :
                            sectionIdx % 6 === 3 ? 'bg-[#F6F6F6]' :
                            sectionIdx % 6 === 4 ? 'bg-white' : 'bg-[#F6F6F6]'
                          }`}
                        >
                          {section.title && (
                            <h3 className="text-lg font-semibold text-gray-900 px-2 mb-4">
                              {section.title}
                            </h3>
                          )}
                          <div className="space-y-2">
                            {section.items.map((item, itemIdx) => (
                              <button
                                key={itemIdx}
                                className="block text-sm font-medium text-left w-full py-0.5 cursor-pointer px-2 text-gray-400 hover:text-gray-800 rounded transition-colors duration-150" 
                                onClick={() => handleNavigateToProducts(item, activeMenu || undefined)}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile/Tablet Sliding Dropdown */}
              <div className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                activeMenu === cat.label ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="bg-gray-50 rounded-lg mt-2 p-4 border border-gray-200 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-blue-600 border-b border-gray-300 pb-2 sticky top-0 bg-gray-50 z-10">
                      {cat.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-2">
                      {megaMenuData[cat.label as keyof typeof megaMenuData]?.sections.map((section) => 
                        section.items
                      ).flat().map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          className="block text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-100 px-3 py-0.5 rounded-md text-left transition-colors duration-150 border border-transparent hover:border-blue-200"
                          onClick={() => handleNavigateToProducts(item, cat.label)}
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
