'use client';
import React from 'react';

const printerData = [
  {
    brand: 'Katun',
    products: [
      { name: 'Katun Pro 3000', code: 'KP3000' },
      { name: 'Katun EcoPrint 200', code: 'KE200' },
      { name: 'Katun ColorMax 150', code: 'KC150' },
      { name: 'Katun SharpPrint 400', code: 'KSP400' },
      { name: 'Katun UltraCopy 250', code: 'KUC250' },
      { name: 'Katun PrintMaster 600', code: 'KPM600' },
      { name: 'Katun QuickPrint 350', code: 'KQP350' },
      { name: 'Katun EcoCopy 500', code: 'KEC500' },
      { name: 'Katun SmartPrint 450', code: 'KSP450' },
      { name: 'Katun ColorPro 700', code: 'KCP700' },
      { name: 'Katun PrintPlus 800', code: 'KPP800' },
      { name: 'Katun EcoPrint 600', code: 'KE600' },
      { name: 'Katun PrintExpert 900', code: 'KPE900' },
    ],
  },
  {
    brand: 'Lexmark',
    products: [
      { name: 'Lexmark C3224dw', code: 'LC3224' },
      { name: 'Lexmark MB2236adw', code: 'LMB2236' },
      { name: 'Lexmark MX611de', code: 'LMX611' },
      { name: 'Katun SharpPrint 400', code: 'KSP400' },
      { name: 'Katun UltraCopy 250', code: 'KUC250' },
      { name: 'Katun PrintMaster 600', code: 'KPM600' },
      { name: 'Katun QuickPrint 350', code: 'KQP350' },
      { name: 'Katun EcoCopy 500', code: 'KEC500' },
      { name: 'Katun SmartPrint 450', code: 'KSP450' },
      { name: 'Katun ColorPro 700', code: 'KCP700' },
      { name: 'Katun PrintPlus 800', code: 'KPP800' },
      { name: 'Katun EcoPrint 600', code: 'KE600' },
      { name: 'Katun PrintExpert 900', code: 'KPE900' },
    ],
  },
  {
    brand: 'Brother',
    products: [
      { name: 'Brother HL-L2350DW', code: 'HL2350' },
      { name: 'Brother MFC-L2750DW', code: 'MFCL2750' },
      { name: 'Brother DCP-L2550DW', code: 'DCPL2550' },
      { name: 'Brother MFC-J995DW', code: 'MFCJ995' },
      { name: 'Brother HL-L6200DW', code: 'HL6200' },
      { name: 'Brother MFC-L8900CDW', code: 'MFCL8900' },
      { name: 'Brother MFC-16945DW', code: 'MFC16945' },
      { name: 'Brother HL-L3210CW', code: 'HLL3210' },
      { name: 'Brother MFC-L3710CW', code: 'MFCL3710' },
      { name: 'Brother HL-L8360CDW', code: 'HLL8360' },
      { name: 'Brother MFC-J5330DW', code: 'MFCJ5330' },
      { name: 'Brother HL-L5000', code: 'HLL5000' },
      { name: 'Brother MFC-L9570CDW', code: 'MFCL9570' },
    ],
  },
  {
    brand: 'Canon',
    products: [
      { name: 'Canon imageCLASS MF445dw', code: 'MF445' },
      { name: 'Canon PIXMA G6020', code: 'G6020' },
      { name: 'Canon MAXIFY MB2720', code: 'MB2720' },
      { name: 'Canon imageRUNNER ADVANCE C5500', code: 'C5500' },
      { name: 'Canon imageCLASS LBP6030w', code: 'LBP6030' },
      { name: 'Canon PIXMA TR8520', code: 'TR8520' },
      { name: 'Canon imageCLASS MF269dw', code: 'MF269' },
      { name: 'Canon MAXIFY GX5020', code: 'GX5020' },
      { name: 'Canon PIXMA TS9120', code: 'TS9120' },
      { name: 'Canon imageCLASS MF445dw', code: 'MF445' },
      { name: 'Canon PIXMA TR150', code: 'TR150' },
      { name: 'Canon imageCLASS D1520', code: 'D1520' },
      { name: 'Canon MAXIFY MB5420', code: 'MB5420' },
    ],
  },
];

const SearchDropdown = () => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-12 z-40 w-[92%] max-w-[1550px] bg-white rounded-md border border-gray-200 px-8 py-5">
      <div className="mb-6 text-2xl font-semibold text-black">Search for products, categories, or brands...</div>
      <div className="flex gap-6 text-base mb-6">
        <input
          type="text"
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Brand"
        />
        <input
          type="text"
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Series"
        />
        <input
          type="text"
          className="flex-1 bg-gray-100 rounded-lg py-2 px-4 text-left text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Select a Printer Model"
        />
      </div>
      <div className="grid grid-cols-4 gap-8">
        {printerData.map((brand) => (
          <div key={brand.brand}>
            <div className="font-semibold text-gray-900 mb-2">Explore {brand.brand} Products</div>
            <ul className="space-y-1">
              {brand.products.map((product, idx) => (
                <li key={product.code + '-' + idx}>

                  <button className={' w-full text-left py-0.5 rounded text-sm text-gray-400 hover:text-orange-500 cursor-pointer transition-colors'}>
                    {product.name} <span className="">({product.code})</span>
                  </button>

                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchDropdown;
