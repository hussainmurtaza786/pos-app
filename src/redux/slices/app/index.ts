import { createSlice } from '@reduxjs/toolkit';
import {
  addInventory,
  deleteInventoryById,
  getInventories,
  getInventoryById,
  updateInventoryById,
} from './inventoryApiThunks';
import {
  addProduct,
  deleteProductById,
  getProductById,
  getProducts,
  updateProductById,
} from './productApiThunks';

import { Inventory, Product } from '@/prisma/customTypes';
import { Category, ProductInOrder } from '@prisma/client';
import { addCategory, getCategories } from './categoryApiThunks ';
import { ProductsGetInput } from '@/app/api/product/route';
import { InventoriesGetInput } from '@/app/api/inventory/route';
import { handlePending, handleReject } from '@/redux/helper';
import { ProductInOrdersGetInput } from '@/app/api/productInOrder/route';
import { addProductInOrder, deleteProductInOrderById, getProductInOrderById, getProductInOrders, updateProductInOrderById } from './productInOrderApiThunk';

interface AdminAppState {
  inventory: {
    items: Inventory[] | null,
    count: number,
    input: InventoriesGetInput,
    itemFullDataById: { [id: string]: Inventory | undefined }
  },
  products: {
    items: Product[] | null,
    count: number,
    input: ProductsGetInput,
    itemFullDataById: { [id: string]: Product | undefined }
  },
  productInOrder: {
    items: ProductInOrder[] | null;
    count: number;
    input: ProductInOrdersGetInput;
    itemFullDataById: { [compositeId: string]: ProductInOrder | undefined };
  };
  category: {
    items: Category[];
    count: number;
    loading: boolean;
    error: string | null;
  };
  fetchingStatus: {
    getInventories: boolean
    getProducts: boolean
    getProductInOrders: boolean

  },
  error: {},
}

const initialState: AdminAppState = {
  products: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {}
  },
  inventory: {
    items: null,
    count: 0,
    input: { pageNumber: 1, pageSize: 10 },
    itemFullDataById: {}
  },
  productInOrder: {
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
  fetchingStatus: {
    getInventories: false,
    getProducts: false,
    getProductInOrders: false,

  },
  error: {},
};

const adminAppSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getInventories.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getInventories = false;
      state.inventory.items = payload.data.items;
      state.inventory.count = payload.data.count;
      state.inventory.input = { ...state.inventory.input, ...arg };
    })
    builder.addCase(getInventories.pending, handlePending("getInventories"))
    builder.addCase(getInventories.rejected, handleReject("getInventories"))
    builder.addCase(addInventory.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.items?.unshift(payload.data);
      if (state.inventory.items?.length === state.inventory.input.pageSize) {
        state.inventory.items?.pop();
      }
      state.inventory.itemFullDataById[payload.data.id] = payload.data;
      state.inventory.count++;
    })
    builder.addCase(deleteInventoryById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.items = state.inventory.items?.filter(item => item.id !== arg) || null;
      delete state.inventory.itemFullDataById[payload.data.id]
    })
    builder.addCase(getInventoryById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.itemFullDataById[payload.data.id] = payload.data;
    })
    builder.addCase(updateInventoryById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.inventory.itemFullDataById[arg.id] = payload.data;
      const index = state.inventory.items?.findIndex(item => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.inventory.items![index] = payload.data;
      }
    })

    // PRODUCTS
    builder.addCase(getProducts.fulfilled, (state, { payload, meta: { arg } }) => {
      state.fetchingStatus.getProducts = false;
      state.products.items = payload.data.items;
      state.products.count = payload.data.count;
      state.products.input = { ...state.products.input, ...arg };
    })
    builder.addCase(getProducts.pending, handlePending("getProducts"))
    builder.addCase(getProducts.rejected, handleReject("getProducts"))

    builder.addCase(addProduct.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.items?.unshift(payload.data);
      if (state.products.items?.length === state.products.input.pageSize) {
        state.products.items?.pop();
      }
      state.products.itemFullDataById[payload.data.id] = payload.data;
      state.products.count++;
    })
    builder.addCase(deleteProductById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.items = state.products.items?.filter(item => item.id !== arg) || null;
      delete state.products.itemFullDataById[payload.data.id]
    })
    builder.addCase(getProductById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.itemFullDataById[payload.data.id] = payload.data;
    })
    builder.addCase(updateProductById.fulfilled, (state, { payload, meta: { arg } }) => {
      state.products.itemFullDataById[arg.id] = payload.data;
      const index = state.products.items?.findIndex(item => item.id === arg.id);
      if (typeof index === 'number' && index > -1) {
        state.products.items![index] = payload.data;
      }
    })

      // ✅ CATEGORIES
      .addCase(getCategories.pending, (state) => {
        state.category.loading = true;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.category.items = action.payload;
        state.category.count = action.payload.length;
        state.category.loading = false;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.category.loading = false;
        state.category.error = action.payload as string;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.category.items.push(action.payload);
        state.category.count += 1;
      });

    // PRODUCT IN ORDER
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
      // Build compositeId from thunk argument
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
        (item) => `${item.orderId}-${item.productId}` === `${arg.id.orderId}-${arg.id.productId}`

        // (item) => `${item.orderId}-${item.productId}` === arg.id
      );
      if (typeof index === 'number' && index > -1) {
        state.productInOrder.items![index] = payload.data;
      }
    });
  },
});

export default adminAppSlice.reducer;
