import { AxiosError, type AxiosAdapter } from 'axios';

type Row = Record<string, any>;
type Store = Record<string, Row[]>;
const STORAGE_KEY = 'pos-client-demo-data-v1';
let memory: Store | undefined;
const dated = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
const record = (id: string, days = 0): Row => ({ id, createdById: 'client-demo', createdAt: dated(days), updatedAt: null });

export function createDemoData(): Store {
  const category = ['Grocery', 'Beverages', 'Snacks', 'Household'].map((name, i) => ({ ...record(`cat-${i}`), name }));
  const catalog: [string, number, number, number][] = [
    ['Basmati Rice 1kg', 450, 350, 0], ['Wheat Flour 5kg', 850, 680, 0],
    ['Cooking Oil 1L', 580, 460, 0], ['Sugar 1kg', 180, 140, 0],
    ['Milk 1L', 280, 220, 1], ['Mango Juice 1L', 320, 240, 1],
    ['Mineral Water 1.5L', 120, 75, 1], ['Tea 200g', 420, 320, 1],
    ['Chocolate Biscuits', 150, 100, 2], ['Potato Chips', 100, 65, 2],
    ['Hand Wash 250ml', 350, 250, 3], ['Laundry Detergent 1kg', 520, 390, 3],
  ];
  const product: Row[] = catalog.map(([name, price, , cat], i) => ({ ...record(`prod-${i}`, 125), name, price, sku: `POS-${String(i + 1).padStart(3, '0')}`, categoryId: `cat-${cat}`, description: 'Retail product' }));
  const inventory: Row[] = catalog.map(([, , purchasePrice], i) => ({ ...record(`stock-${i}`, 125), productId: `prod-${i}`, purchasePrice, purchasedQuantity: 100, availableQuantity: 100, description: 'Opening stock' }));
  const days = [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20, 25, 30, 35, 45, 60, 70, 80, 90, 100, 120];
  const productInOrder: Row[] = [];
  const order = days.map((day, i) => {
    const id = `ord-${String(i + 1).padStart(3, '0')}`;
    const lines = [i % 12, (i + 4) % 12, (i + 7) % 12].map((p, n) => {
      const quantity = 1 + (i + n) % 3;
      inventory[p].availableQuantity -= quantity;
      return { orderId: id, productId: product[p].id, inventoryId: inventory[p].id, quantity, sellPrice: product[p].price, createdAt: dated(day), updatedAt: null };
    });
    productInOrder.push(...lines);
    const discount = i % 4 === 0 ? 50 : 0;
    const total = lines.reduce((sum, line) => sum + line.quantity * Number(line.sellPrice), 0) - discount;
    return { ...record(id, day), description: `Sale ${i + 1}`, discount, amountReceived: i === 1 ? total / 2 : total, status: i === 1 ? 'Pending' : 'Completed' };
  });
  const returnLines: Row[] = [];
  const returns = [0, 4, 7].map((p, i) => {
    inventory[p].availableQuantity++;
    const id = `ret-${i + 1}`;
    returnLines.push({ returnOrderId: id, productId: product[p].id, quantity: 1, sellPrice: product[p].price, createdAt: dated([0, 3, 35][i]), updatedAt: null });
    return { ...record(id, [0, 3, 35][i]), description: 'Unopened item returned', returnAmount: product[p].price };
  });
  const expenses = [['Delivery fuel', 180, 0], ['Shopping bags', 120, 0], ['Cleaning supplies', 150, 2], ['Local delivery', 250, 4], ['Store electricity', 600, 7], ['Internet bill', 800, 25], ['Shelf maintenance', 450, 45], ['Printing receipts', 350, 80]].map(([reason, amount, days], i) => ({ ...record(`exp-${i}`, Number(days)), reason, amount, userId: 'client-demo' }));
  return { category, product, inventory, order, productInOrder, return: returns, returnLines, expenses };
}

// Clean the previous labels in saved records without resetting browser edits.
function cleanLabels(store: Store): Store {
  for (const rows of Object.values(store)) for (const row of rows) {
    for (const field of ['id', 'orderId', 'returnOrderId', 'productId', 'inventoryId', 'categoryId']) {
      if (typeof row[field] === 'string') row[field] = row[field].replace('-demo-', '-');
    }
    if (/^DEMO-\d+$/.test(row.sku || '')) row.sku = row.sku.replace('DEMO-', 'POS-');
    if (row.description === 'Sample product') row.description = 'Retail product';
    if (/^Sample sale \d+$/.test(row.description || '')) row.description = row.description.replace('Sample sale ', 'Sale ');
  }
  return store;
}

function load(): Store {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return cleanLabels(JSON.parse(saved));
  } catch { /* Storage may be unavailable in private browsing. */ }
  return cleanLabels(structuredClone(memory || createDemoData()));
}
function save(store: Store) {
  memory = structuredClone(store);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* Keep the demo usable in memory. */ }
}

function hydrate(store: Store, type: string, row: Row): Row {
  const product = (id: string) => {
    const p = store.product.find(item => item.id === id);
    return p && { ...p, category: store.category.find(cat => cat.id === p.categoryId) };
  };
  const line = (item: Row) => ({ ...item, product: product(item.productId), inventory: store.inventory.find(inv => inv.id === item.inventoryId) });
  if (type === 'product') return product(row.id)!;
  if (type === 'inventory') return { ...row, product: product(row.productId) };
  if (type === 'order') return { ...row, ProductInOrder: store.productInOrder.filter(item => item.orderId === row.id).map(line) };
  if (type === 'return') return { ...row, ReturnOrderProduct: store.returnLines.filter(item => item.returnOrderId === row.id).map(line) };
  if (type === 'productInOrder') return { ...line(row), order: store.order.find(item => item.id === row.orderId) };
  return { ...row };
}

function moveStock(store: Store, lines: Row[], direction: number) {
  const quantities = new Map<string, number>();
  for (const line of lines) {
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty <= 0 || !store.product.some(p => p.id === line.productId)) throw new Error('Select a product and a valid quantity.');
    quantities.set(line.productId, (quantities.get(line.productId) || 0) + qty);
  }
  for (const [productId, qty] of quantities) {
    const batches = store.inventory.filter(inv => inv.productId === productId);
    if (!batches.length || (direction < 0 && batches.reduce((sum, inv) => sum + inv.availableQuantity, 0) < qty)) throw new Error('Out of stock');
    if (direction > 0) { batches[0].availableQuantity += qty; continue; }
    let remaining = qty;
    for (const batch of batches) {
      const deduct = Math.min(remaining, batch.availableQuantity);
      batch.availableQuantity -= deduct;
      remaining -= deduct;
    }
  }
}

export const demoAdapter: AxiosAdapter = async config => {
  const store = load();
  const [, type, pathId] = (config.url || '').split('/').filter(Boolean);
  const params = config.params || {};
  const body: Row = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
  const method = (config.method || 'get').toLowerCase();
  const respond = (data: unknown, status = 200) => ({ data: { data }, status, statusText: 'OK', headers: {}, config });
  const fail = (message: string, status = 400): never => {
    throw new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, { data: { error: message, message }, status, statusText: message, headers: {}, config });
  };
  const rows = store[type];
  if (!rows || type === 'returnLines') return fail('Endpoint unavailable', 404);
  const key = (row: Row) => type === 'productInOrder' ? `${row.orderId}-${row.productId}` : row.id;
  const targetId = pathId || body.id;
  const current = rows.find(row => key(row) === targetId);
  if (method === 'get') {
    if (pathId) return current ? respond(hydrate(store, type, current)) : fail('Record not found', 404);
    let filtered = rows.filter(row => (!params.productId || row.productId === params.productId) && (!params.orderId || row.orderId === params.orderId) && (!params.categoryId || row.categoryId === params.categoryId));
    if (params.search) filtered = filtered.filter(row => String(row[params.searchField || 'name'] || '').toLowerCase().includes(String(params.search).toLowerCase()));
    filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const start = (Math.max(1, Number(params.pageNumber || 1)) - 1) * Number(params.pageSize || 10);
    const items = filtered.slice(start, start + Number(params.pageSize || 10)).map(row => hydrate(store, type, row));
    return respond(type === 'category' ? filtered.map(row => hydrate(store, type, row)) : { count: filtered.length, items });
  }
  try {
    if (method === 'delete') {
      if (!current) return fail('Record not found', 404);
      if (type === 'product' && (store.inventory.some(inv => inv.productId === current.id) || store.productInOrder.some(line => line.productId === current.id))) return fail('This product has stock or sales history.');
      if (type === 'order' || type === 'return') {
        const lineType = type === 'order' ? 'productInOrder' : 'returnLines';
        const field = type === 'order' ? 'orderId' : 'returnOrderId';
        moveStock(store, store[lineType].filter(line => line[field] === current.id), type === 'order' ? 1 : -1);
        store[lineType] = store[lineType].filter(line => line[field] !== current.id);
      }
      if (type === 'productInOrder') moveStock(store, [current], 1);
      rows.splice(rows.indexOf(current), 1);
      save(store);
      return respond(current);
    }
    const updating = !!targetId;
    if (updating && !current) return fail('Record not found', 404);
    const row: Row = { ...(current || record(`${type}-${crypto.randomUUID()}`)), ...body, updatedAt: new Date().toISOString() };
    if (type === 'category' && rows.some(item => item.id !== row.id && item.name.toLowerCase() === String(row.name).toLowerCase())) return fail('Category already exists');
    if (type === 'product') {
      row.price = Number(row.price);
      if (!row.name || !row.sku || !store.category.some(cat => cat.id === row.categoryId) || !Number.isFinite(row.price) || row.price < 0) return fail('Enter a name, SKU, category and valid price.');
      if (rows.some(item => item.id !== row.id && item.sku === row.sku)) return fail('SKU already exists');
    }
    if (type === 'inventory') {
      const quantity = Number(body.quantity ?? row.purchasedQuantity);
      if (!Number.isInteger(quantity) || quantity < 1 || !store.product.some(p => p.id === row.productId)) return fail('Select a product and a valid quantity.');
      row.purchasedQuantity = quantity;
      row.availableQuantity = current ? current.availableQuantity + quantity - current.purchasedQuantity : quantity;
      row.purchasePrice = Number(row.purchasePrice);
      if (row.availableQuantity < 0 || !Number.isFinite(row.purchasePrice) || row.purchasePrice < 0) return fail('Invalid stock quantity or purchase price');
      delete row.quantity;
    }
    if ((type === 'order' || type === 'return') && !updating) {
      const lines = (body.products || []) as Row[];
      if (!lines.length) return fail('Select at least one product');
      if (lines.some(line => !Number.isFinite(Number(line.sellPrice)) || Number(line.sellPrice) < 0)) return fail('Enter a valid sale price');
      if (type === 'return') for (const line of lines) {
        const sold = store.productInOrder.filter(item => item.productId === line.productId).reduce((sum, item) => sum + item.quantity, 0);
        const returned = store.returnLines.filter(item => item.productId === line.productId).reduce((sum, item) => sum + item.quantity, 0);
        const requested = lines.filter(item => item.productId === line.productId).reduce((sum, item) => sum + Number(item.quantity), 0);
        if (requested > sold - returned) return fail('Return quantity exceeds sales.');
      }
      moveStock(store, lines, type === 'order' ? -1 : 1);
      const lineType = type === 'order' ? 'productInOrder' : 'returnLines';
      const field = type === 'order' ? 'orderId' : 'returnOrderId';
      store[lineType].push(...lines.map(line => ({ ...line, [field]: row.id, quantity: Number(line.quantity), sellPrice: Number(line.sellPrice), createdAt: row.createdAt, updatedAt: null })));
      row.status = row.status || 'Completed';
      for (const field of ['discount', 'amountReceived', 'returnAmount']) if (row[field] !== undefined) row[field] = Number(row[field]);
      delete row.products;
    }
    if (type === 'productInOrder') {
      if (!store.order.some(order => order.id === row.orderId)) return fail('Order not found', 404);
      if (current) moveStock(store, [current], 1);
      moveStock(store, [row], -1);
    }
    if (type === 'expenses') {
      row.amount = Number(row.amount);
      row.userId = 'client-demo';
      if (!Number.isFinite(row.amount) || row.amount < 0) return fail('Enter a valid expense amount');
    }
    if (current) rows[rows.indexOf(current)] = row;
    else rows.push(row);
    save(store);
    return respond(hydrate(store, type, row), updating ? 200 : 201);
  } catch (error) {
    if (error instanceof AxiosError) throw error;
    return fail(error instanceof Error ? error.message : 'Operation failed');
  }
};
