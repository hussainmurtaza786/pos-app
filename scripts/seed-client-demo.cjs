// Run with DEMO_EMAIL and DEMO_PASSWORD set, using node --env-file=.env.
// Adds account-scoped sample records; rerunning does not duplicate or reset data.
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const bcrypt = require('bcryptjs');
const { createHash } = require('node:crypto');

const email = process.env.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD;
if (!email || !password) throw new Error('Set DEMO_EMAIL and DEMO_PASSWORD.');
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.POSTGRES_PRISMA_POOL_URL }),
});
const prefix = `demo-${createHash('sha256').update(email).digest('hex').slice(0, 12)}`;
const id = (type, n) => `${prefix}-${type}-${n}`;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const dated = (daysAgo, hour = 10) => {
  const date = new Date(`${today}T${String(hour).padStart(2, '0')}:00:00+05:00`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
};

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && (!existing.isActive || !(await bcrypt.compare(password, existing.password)))) {
    throw new Error('An existing account has different credentials or is suspended; it was not changed.');
  }
  const hashedPassword = existing ? existing.password : await bcrypt.hash(password, 10);
  const catalog = [
    ['Basmati Rice 1kg', 450, 350, 0, 100],
    ['Wheat Flour 5kg', 850, 680, 0, 60],
    ['Cooking Oil 1L', 580, 460, 0, 80],
    ['Sugar 1kg', 180, 140, 0, 90],
    ['Milk 1L', 280, 220, 1, 100],
    ['Mango Juice 1L', 320, 240, 1, 80],
    ['Mineral Water 1.5L', 120, 75, 1, 120],
    ['Tea 200g', 420, 320, 1, 75],
    ['Chocolate Biscuits', 150, 100, 2, 100],
    ['Potato Chips', 100, 65, 2, 90],
    ['Hand Wash 250ml', 350, 250, 3, 60],
    ['Laundry Detergent 1kg', 520, 390, 3, 55],
  ];
  const sold = catalog.map(() => 0);
  const returned = catalog.map(() => 0);
  const orders = [];
  const orderLines = [];
  const days = [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20, 25, 30, 35, 45, 60, 70, 80, 90, 100, 120];
  for (let n = 0; n < days.length; n++) {
    const productIndexes = [n % catalog.length, (n + 4) % catalog.length, (n + 7) % catalog.length];
    const createdAt = dated(days[n], 9 + n % 8);
    const lines = productIndexes.map((index, line) => {
      const quantity = 1 + (n + line) % 3;
      sold[index] += quantity;
      return { orderId: id('order', n), productId: id('product', index), inventoryId: id('stock', index), quantity, sellPrice: catalog[index][1], createdAt };
    });
    const total = lines.reduce((sum, line) => sum + line.quantity * line.sellPrice, 0);
    const discount = n % 4 === 0 ? 50 : 0;
    const pending = n === 1 || n === 7;
    orders.push({ id: id('order', n), description: `DEMO: Sample sale ${String(n + 1).padStart(3, '0')}`, discount, amountReceived: pending ? Math.floor((total - discount) / 2) : total - discount, status: pending ? 'Pending' : 'Completed', createdAt });
    orderLines.push(...lines);
  }
  const returns = [];
  const returnLines = [];
  for (const [n, index] of [0, 4, 7].entries()) {
    returned[index] += 1;
    const createdAt = dated([0, 3, 35][n], 17);
    returns.push({ id: id('return', n), description: 'DEMO: Customer returned one unopened item', returnAmount: catalog[index][1], createdAt });
    returnLines.push({ returnOrderId: id('return', n), productId: id('product', index), quantity: 1, sellPrice: catalog[index][1], createdAt });
  }
  const expenseSamples = [
    ['Delivery fuel', 180, 0], ['Shopping bags', 120, 0],
    ['Cleaning supplies', 150, 2], ['Local delivery', 250, 4],
    ['Store electricity', 600, 7], ['Internet bill', 800, 25],
    ['Shelf maintenance', 450, 45], ['Printing receipts', 350, 80],
  ];

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({ where: { email }, create: { email, password: hashedPassword, userRole: 'Staff' }, update: {} });
    const owner = { createdById: user.id };
    await tx.category.createMany({ data: ['Grocery', 'Beverages', 'Snacks', 'Household'].map((name, n) => ({ id: id('category', n), name: `Demo ${name}`, ...owner, createdAt: dated(125) })), skipDuplicates: true });
    await tx.product.createMany({ data: catalog.map(([name, price, , category], n) => ({ id: id('product', n), sku: `DEMO-${String(n + 1).padStart(3, '0')}`, name, price, description: 'Sample product for client demonstration', categoryId: id('category', category), ...owner, createdAt: dated(125) })), skipDuplicates: true });
    await tx.inventory.createMany({ data: catalog.map(([, , purchasePrice, , purchasedQuantity], n) => ({ id: id('stock', n), productId: id('product', n), description: 'DEMO: Opening stock', purchasedQuantity, availableQuantity: purchasedQuantity - sold[n] + returned[n], purchasePrice, ...owner, createdAt: dated(125) })), skipDuplicates: true });
    await tx.order.createMany({ data: orders.map(order => ({ ...order, ...owner })), skipDuplicates: true });
    await tx.productInOrder.createMany({ data: orderLines, skipDuplicates: true });
    await tx.returnOrder.createMany({ data: returns.map(record => ({ ...record, ...owner })), skipDuplicates: true });
    await tx.returnOrderProduct.createMany({ data: returnLines, skipDuplicates: true });
    await tx.expense.createMany({ data: expenseSamples.map(([reason, amount, daysAgo], n) => ({ id: id('expense', n), reason: `DEMO: ${reason}`, amount, userId: user.id, createdAt: dated(daysAgo) })), skipDuplicates: true });
    return user;
  }, { timeout: 60000 });

  const [categories, products, inventories, sales, refunds, expenses, stocks] = await Promise.all([
    prisma.category.count({ where: { createdById: user.id } }),
    prisma.product.count({ where: { createdById: user.id } }),
    prisma.inventory.count({ where: { createdById: user.id } }),
    prisma.order.count({ where: { createdById: user.id } }),
    prisma.returnOrder.count({ where: { createdById: user.id } }),
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.inventory.findMany({ where: { createdById: user.id, id: { startsWith: prefix } }, select: { productId: true, purchasedQuantity: true, availableQuantity: true } }),
  ]);
  for (let n = 0; n < catalog.length; n++) {
    const stock = stocks.find(record => record.productId === id('product', n));
    if (!stock || stock.availableQuantity < 0 || stock.purchasedQuantity !== catalog[n][4]) throw new Error('Demo stock verification failed.');
  }
  console.log(JSON.stringify({ email: user.email, passwordVerified: await bcrypt.compare(password, user.password), categories, products, inventories, orders: sales, returns: refunds, expenses, stockVerified: true }));
}

main().catch(error => {
  // Avoid logging connection strings or credentials from driver errors.
  console.error(error.code || error.name || 'Demo setup failed');
  if (error.message.startsWith('An existing account') || error.message.startsWith('Demo stock')) console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
