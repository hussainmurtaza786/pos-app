import { createSlice } from '@reduxjs/toolkit';
import { addInventory, deleteInventoryById, getInventories, getInventoryById, updateInventoryById, } from './inventoryApiThunks';
import { addProduct, deleteProductById, getProductById, getProducts, updateProductById, } from './productApiThunks';

import { Inventory, Order, Product, ProductInOrder, ReturnOrder } from '@/prisma/customTypes';
import { Category, Expense } from '@prisma/client';
import { addCategory, getCategories } from './categoryApiThunks ';
import { ProductsGetInput } from '@/app/api/product/route';
import { InventoriesGetInput } from '@/app/api/inventory/route';
import { OrdersGetInput } from '@/app/api/order/route';
import { ProductInOrdersGetInput } from '@/app/api/productInOrder/route';
import {
  addProductInOrder,
  deleteProductInOrderById,
  getProductInOrderById,
  getProductInOrders,
  updateProductInOrderById,
} from './productInOrderApiThunk';

import { handlePending, handleReject } from '@/redux/helper';
import { addOrder, deleteOrderById, getOrderById, getOrders, updateOrderById } from './orderApiThunk';
import { ReturnsGetInput } from '@/app/api/return/route';
import { addReturn, deleteReturnById, getReturnById, getReturns, updateReturnById } from './returnApiThunk';
import { addExpense, deleteExpenseById, getExpenseById, getExpenses, updateExpenseById } from './expenseApiThunk';
import { ExpensesGetInput } from '@/app/api/expenses/route';

// -------------------------
// State Interface
// -------------------------
interface AdminAppState {
  inventory: {
    items: Inventory[] | null;
    count: number;
    input: InventoriesGetInput;
    itemFullDataById: { [id: string]: Inventory | undefined };
  };
  products: {
    items: Product[] | null;
    count: number;
    input: ProductsGetInput;
    itemFullDataById: { [id: string]: Product | undefined };
  };
  productInOrder: {
    items: ProductInOrder[] | null;
    count: number;
    input: ProductInOrdersGetInput;
    itemFullDataById: { [compositeId: string]: ProductInOrder | undefined };
  };
  order: {
    items: Order[] | null;
    count: number;
    input: OrdersGetInput;
    itemFullDataById: { [id: string]: Order | undefined };
  };
  return: {
    items: ReturnOrder[] | null;
    count: number;
    input: ReturnsGetInput;
    itemFullDataById: { [id: string]: ReturnOrder | undefined };
  };
  expenses: {
    items: Expense[] | null;
    count: number;
    input: ExpensesGetInput;
    itemFullDataById: { [id: string]: Expense | undefined };
  };
  category: {
    items: Category[];
    count: number;
    loading: boolean;
    error: string | null;
  };

  fetchingStatus: {
    getInventories: boolean;
    getProducts: boolean;
    getProductInOrders: boolean;
    getOrders: boolean;
    getReturns: boolean
    getExpenses: boolean
  };
  error: {};
}

// -------------------------
// Initial State
// -------------------------
const initialState: AdminAppState = {
  products: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  inventory: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  productInOrder: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  order: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  return: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  category: {
    items: [],
    count: 0,
    loading: false,
    error: null,
  },
  expenses: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {},
  },
  fetchingStatus: {
    getInventories: false,
    getProducts: false,
    getProductInOrders: false,
    getOrders: false,
    getReturns: false,
    getExpenses: false
  },
  error: {},
};

// -------------------------
// Slice
// -------------------------
const adminAppSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ============================
    // INVENTORY
    // ============================
    builder.addCase(getInventories.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getInventories = false;
      state.inventory.items = payload.data.items;
      state.inventory.count = payload.data.count;
      state.inventory.input = { ...state.inventory.input, ...arg };
    });
    builder.addCase(getInventories.pending, handlePending('getInventories'));
    builder.addCase(getInventories.rejected, handleReject('getInventories'));
    builder.addCase(addInventory.fulfilled, (state, { payload }) => {
      state.inventory.items?.unshift(payload.data);
      if (state.inventory.items?.length === state.inventory.input.pageSize) {
        state.inventory.items?.pop();
      }
      state.inventory.itemFullDataById[payload.data.id] = payload.data;
      state.inventory.count++;
    });
    builder.addCase(deleteInventoryById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.items = state.inventory.items?.filter((item) => item.id !== arg) || null;
      delete state.inventory.itemFullDataById[payload.data.id];
    });
    builder.addCase(getInventoryById.fulfilled, (state, { payload }) => {
      state.inventory.itemFullDataById[payload.data.id] = payload.data;
    });
    builder.addCase(updateInventoryById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.itemFullDataById[arg.id] = payload.data;
      const index = state.inventory.items?.findIndex((item) => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.inventory.items![index] = payload.data;
      }
    });

    // ============================
    // PRODUCTS
    // ============================
    builder.addCase(getProducts.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getProducts = false;
      state.products.items = payload.data.items;
      state.products.count = payload.data.count;
      state.products.input = { ...state.products.input, ...arg };
    });
    builder.addCase(getProducts.pending, handlePending('getProducts'));
    builder.addCase(getProducts.rejected, handleReject('getProducts'));
    builder.addCase(addProduct.fulfilled, (state, { payload }) => {
      state.products.items?.unshift(payload.data);
      if (state.products.items?.length === state.products.input.pageSize) {
        state.products.items?.pop();
      }
      state.products.itemFullDataById[payload.data.id] = payload.data;
      state.products.count++;
    });
    builder.addCase(deleteProductById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.items = state.products.items?.filter((item) => item.id !== arg) || null;
      delete state.products.itemFullDataById[payload.data.id];
    });
    builder.addCase(getProductById.fulfilled, (state, { payload }) => {
      state.products.itemFullDataById[payload.data.id] = payload.data;
    });
    builder.addCase(updateProductById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.itemFullDataById[arg.id] = payload.data;
      const index = state.products.items?.findIndex((item) => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.products.items![index] = payload.data;
      }
    });

    // ============================
    // ORDERS
    // ============================
    builder.addCase(getOrders.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getOrders = false;
      state.order.items = payload.items;
      state.order.count = payload.count;
      state.order.input = { ...state.order.input, ...arg };
    });
    builder.addCase(getOrders.pending, handlePending('getOrders'));
    builder.addCase(getOrders.rejected, handleReject('getOrders'));
    builder.addCase(addOrder.fulfilled, (state, { payload }) => {
      state.order.items?.unshift(payload.data);
      if (state.order.items?.length === state.order.input.pageSize) {
        state.order.items?.pop();
      }
      state.order.itemFullDataById[payload.data.id] = payload.data;
      state.order.count++;
    });
    builder.addCase(deleteOrderById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.order.items = state.order.items?.filter((item) => item.id !== arg) || null;
      delete state.order.itemFullDataById[payload.data.id];
    });
    builder.addCase(getOrderById.fulfilled, (state, { payload }) => {
      state.order.itemFullDataById[payload.data.id] = payload.data;
    });
    builder.addCase(updateOrderById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.order.itemFullDataById[arg.id] = payload.data;
      const index = state.order.items?.findIndex((item) => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.order.items![index] = payload.data;
      }
    });

    // ============================
    // CATEGORIES
    // ============================
    builder.addCase(getCategories.pending, (state) => {
      state.category.loading = true;
    });
    builder.addCase(getCategories.fulfilled, (state, action) => {
      state.category.items = action.payload;
      state.category.count = action.payload.length;
      state.category.loading = false;
    });
    builder.addCase(getCategories.rejected, (state, action) => {
      state.category.loading = false;
      state.category.error = action.payload as string;
    });
    builder.addCase(addCategory.fulfilled, (state, action) => {
      state.category.items.push(action.payload);
      state.category.count += 1;
    });

    // ============================
    // PRODUCT IN ORDER
    // ============================
    builder.addCase(getProductInOrders.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getProductInOrders = false;
      state.productInOrder.items = payload.data.items;
      state.productInOrder.count = payload.data.count;
      state.productInOrder.input = { ...state.productInOrder.input, ...arg };
    });
    builder.addCase(getProductInOrders.pending, handlePending('getProductInOrders'));
    builder.addCase(getProductInOrders.rejected, handleReject('getProductInOrders'));
    builder.addCase(addProductInOrder.fulfilled, (state, { payload }) => {
      state.productInOrder.items?.unshift(payload.data);
      if (state.productInOrder.items?.length === state.productInOrder.input.pageSize) {
        state.productInOrder.items?.pop();
      }
      const compositeId = `${payload.data.orderId}-${payload.data.productId}`;
      state.productInOrder.itemFullDataById[compositeId] = payload.data;
      state.productInOrder.count++;
    });
    builder.addCase(deleteProductInOrderById.fulfilled, (state, { payload, meta: { arg } }) => {
      const argCompositeId = `${arg.orderId}-${arg.productId}`;
      state.productInOrder.items =
        state.productInOrder.items?.filter(
          (item) => `${item.orderId}-${item.productId}` !== argCompositeId
        ) || null;
      const compositeId = `${payload.data.orderId}-${payload.data.productId}`;
      delete state.productInOrder.itemFullDataById[compositeId];
    });
    builder.addCase(getProductInOrderById.fulfilled, (state, { payload }) => {
      const compositeId = `${payload.data.orderId}-${payload.data.productId}`;
      state.productInOrder.itemFullDataById[compositeId] = payload.data;
    });
    builder.addCase(updateProductInOrderById.fulfilled, (state, { payload, meta: { arg } }) => {
      const compositeId = `${payload.data.orderId}-${payload.data.productId}`;
      state.productInOrder.itemFullDataById[compositeId] = payload.data;
      const index = state.productInOrder.items?.findIndex(
        (item) =>
          `${item.orderId}-${item.productId}` ===
          `${arg.id.orderId}-${arg.id.productId}`
      );
      if (typeof index === 'number' && index > -1) {
        state.productInOrder.items![index] = payload.data;
      }
    });

    // ============================
    // RETURNS
    // ============================
    builder.addCase(getReturns.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getReturns = false;
      state.return.items = payload.items;
      state.return.count = payload.count;
      state.return.input = { ...state.return.input, ...arg };
    });
    builder.addCase(getReturns.pending, handlePending('getReturns'));
    builder.addCase(getReturns.rejected, handleReject('getReturns'));
    builder.addCase(addReturn.fulfilled, (state, { payload }) => {
      state.return.items?.unshift(payload.data);
      if (state.return.items?.length === state.return.input.pageSize) {
        state.return.items?.pop();
      }
      state.return.itemFullDataById[payload.data.id] = payload.data;
      state.return.count++;
    });
    builder.addCase(deleteReturnById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.return.items = state.return.items?.filter((item) => item.id !== arg) || null;
      delete state.return.itemFullDataById[payload.data.id];
    });
    builder.addCase(getReturnById.fulfilled, (state, { payload }) => {
      state.return.itemFullDataById[payload.data.id] = payload.data;
    });
    builder.addCase(updateReturnById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.return.itemFullDataById[arg.id] = payload.data;
      const index = state.return.items?.findIndex((item) => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.return.items![index] = payload.data;
      }
    });
    // ============================
    // EXPENSES
    // ============================
    //   builder.addCase(getExpenses.fulfilled, (state, { payload }) => {
    //     state.fetchingStatus.getExpenses = false;
    //     state.expense.items = payload.data.items;
    //     state.expense.count = payload.data.count;
    //   });
    //   builder.addCase(getExpenses.pending, handlePending('getExpenses'));
    //   builder.addCase(getExpenses.rejected, handleReject('getExpenses'));

    //   builder.addCase(addExpense.fulfilled, (state, { payload }) => {
    //     state.expense.items.unshift(payload.data);
    //     state.expense.count += 1;
    //   });
    //   builder.addCase(deleteExpenseById.fulfilled, (state, { payload }) => {
    //     state.expense.items = state.expense.items.filter((item) => item.id !== payload.data.id);
    //     state.expense.count -= 1;
    //   });
    //   builder.addCase(updateExpenseById.fulfilled, (state, { payload }) => {
    //     const index = state.expense.items.findIndex((item) => item.id === payload.data.id);
    //     if (index > -1) {
    //       state.expense.items[index] = payload.data;
    //     }
    //});
    // ============================
    // EXPENSES
    // ============================
    builder.addCase(getExpenses.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getExpenses = false;
      state.expenses.items = payload.data.items;
      state.expenses.count = payload.data.count;
      state.expenses.input = { ...state.expenses.input, ...arg };
    });

    builder.addCase(getExpenses.pending, handlePending('getExpenses'));
    builder.addCase(getExpenses.rejected, handleReject('getExpenses'));

    builder.addCase(addExpense.fulfilled, (state, { payload }) => {
      state.expenses.items?.unshift(payload.data);
      if (state.expenses.items?.length === state.expenses.input.pageSize) {
        state.expenses.items?.pop();
      }
      state.expenses.itemFullDataById[payload.data.id] = payload.data;
      state.expenses.count++;
    });

    builder.addCase(deleteExpenseById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.expenses.items = state.expenses.items?.filter((item) => item.id !== arg) || null;
      delete state.expenses.itemFullDataById[payload.data.id];
      state.expenses.count--;
    });

    builder.addCase(getExpenseById.fulfilled, (state, { payload }) => {
      state.expenses.itemFullDataById[payload.data.id] = payload.data;
    });

    builder.addCase(updateExpenseById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.expenses.itemFullDataById[arg.id] = payload.data;
      const index = state.expenses.items?.findIndex((item) => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.expenses.items![index] = payload.data;
      }
    });


  },
});

export default adminAppSlice.reducer;
