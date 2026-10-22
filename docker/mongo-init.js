db = db.getSiblingDB('catalog');

db.products.insertMany([
  {
    _id: 'PROD-001',
    name: 'Notebook Dell Inspiron 15',
    description: 'Notebook 15 polegadas, 16GB RAM, SSD 512GB',
    status: 'ATIVO',
    prices: [
      { value: NumberDecimal('3500.00'), currency: 'BRL', validFrom: ISODate('2025-01-01T00:00:00Z'), validTo: null }
    ]
  },
  {
    _id: 'PROD-002',
    name: 'Mouse Logitech MX Master 3S',
    description: 'Mouse sem fio ergonometrico',
    status: 'ATIVO',
    prices: [
      { value: NumberDecimal('499.90'), currency: 'BRL', validFrom: ISODate('2025-01-01T00:00:00Z'), validTo: null }
    ]
  },
  {
    _id: 'PROD-003',
    name: 'Teclado Mecanico Keychron K2',
    description: 'Teclado mecanico wireless com switch brown',
    status: 'ATIVO',
    prices: [
      { value: NumberDecimal('700.00'), currency: 'BRL', validFrom: ISODate('2025-01-01T00:00:00Z'), validTo: ISODate('2025-06-01T00:00:00Z') },
      { value: NumberDecimal('649.90'), currency: 'BRL', validFrom: ISODate('2025-06-01T00:00:00Z'), validTo: null }
    ]
  },
  {
    _id: 'PROD-004',
    name: 'Monitor LG UltraGear 24',
    description: 'Monitor gamer 24 polegadas 144Hz',
    status: 'INATIVO',
    prices: [
      { value: NumberDecimal('1200.00'), currency: 'BRL', validFrom: ISODate('2025-01-01T00:00:00Z'), validTo: null }
    ]
  },
  {
    _id: 'PROD-005',
    name: 'Webcam Logitech C920',
    description: 'Webcam Full HD 1080p',
    status: 'ATIVO',
    prices: [
      { value: NumberDecimal('599.00'), currency: 'BRL', validFrom: ISODate('2030-01-01T00:00:00Z'), validTo: null }
    ]
  },
  {
    _id: 'PROD-006',
    name: 'Headset HyperX Cloud II',
    description: 'Headset gamer surround 7.1',
    status: 'ATIVO',
    prices: [
      { value: NumberDecimal('799.00'), currency: 'BRL', validFrom: ISODate('2025-01-01T00:00:00Z'), validTo: ISODate('2025-03-01T00:00:00Z') }
    ]
  }
]);
