export const sampleProducts = [
  {
    id: 'product-HP-LASERJET-1100',
    sku: 'HP-LASERJET-1100',
    name: 'HP LaserJet Pro 1100',
    brand: 'HP',
    description: 'Compact monochrome laser printer for small offices',
    categoryId: 'printers',
    basePrice: 19999, // $199.99 in cents
    attributes: {
      colorOptions: ['Black'],
      connectivity: ['USB', 'WiFi']
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'product-HP-INK-664-BK',
    sku: 'HP-INK-664-BK',
    name: 'HP 664 Black Ink Cartridge',
    brand: 'HP',
    description: 'Original HP black ink cartridge',
    categoryId: 'cartridges',
    basePrice: 2999, // $29.99 in cents
    attributes: {
      colorOptions: ['Black'],
      capacity: ['Standard']
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'product-CANON-PIXMA-2540',
    sku: 'CANON-PIXMA-2540',
    name: 'Canon PIXMA TS2540 Printer',
    brand: 'Canon',
    description: 'All-in-one wireless inkjet printer',
    categoryId: 'printers',
    basePrice: 8999, // $89.99 in cents
    attributes: {
      colorOptions: ['White', 'Black'],
      connectivity: ['USB', 'WiFi']
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const sampleCategories = [
  {
    id: 'printers',
    name: 'Printers',
    path: ['Electronics', 'Printers'],
    attributes: ['brand', 'color', 'connectivity'],
    createdAt: new Date()
  },
  {
    id: 'cartridges',
    name: 'Cartridges',
    path: ['Electronics', 'Printers', 'Cartridges'],
    attributes: ['brand', 'color', 'capacity'],
    createdAt: new Date()
  },
  {
    id: 'paper',
    name: 'Paper',
    path: ['Office Supplies', 'Paper'],
    attributes: ['size', 'weight', 'finish'],
    createdAt: new Date()
  }
];