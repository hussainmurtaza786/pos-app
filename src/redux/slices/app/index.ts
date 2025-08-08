import { createSlice } from '@reduxjs/toolkit';
import {
  addInventory,
  deleteInventoryById,
  getInventories,
  updateInventoryById,
} from './inventoryApiThunks';
import {
  addProduct,
  deleteProductById,
  getProducts,
  updateProductById,
} from './productApiThunks';

import { Inventory, Product } from '@/prisma/customTypes';
import { Category } from '@prisma/client';
import { addCategory, getCategories } from './categoryApiThunks ';

interface AdminAppState {
  product: {
    items: Product[];
    count: number;
    loading: boolean;
    error: string | null;
  };
  inventory: {
    items: Inventory[];
    count: number;
    loading: boolean;
    error: string | null;
  };
  category: {
    items: Category[];
    count: number;
    loading: boolean;
    error: string | null;
  };
}

const initialState: AdminAppState = {
  product: {
    items: [],
    count: 0,
    loading: false,
    error: null,
  },
  inventory: {
    items: [],
    count: 0,
    loading: false,
    error: null,
  },
  category: {
    items: [],
    count: 0,
    loading: false,
    error: null,
  },
};

const adminAppSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // INVENTORY
      .addCase(getInventories.pending, (state) => {
        state.inventory.loading = true;
      })
      .addCase(getInventories.fulfilled, (state, action) => {
        state.inventory.items = action.payload.items;
        state.inventory.count = action.payload.count;
        state.inventory.loading = false;
      })
      .addCase(getInventories.rejected, (state, action) => {
        state.inventory.loading = false;
        state.inventory.error = action.payload as string;
      })
      .addCase(addInventory.fulfilled, (state, action) => {
        state.inventory.items.push(action.payload);
        state.inventory.count += 1;
      })
      .addCase(updateInventoryById.fulfilled, (state, action) => {
        const index = state.inventory.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.inventory.items[index] = action.payload;
        }
      })
      .addCase(deleteInventoryById.fulfilled, (state, action) => {
        state.inventory.items = state.inventory.items.filter(
          (item: any) => item.id !== action.payload
        );
      })

      // PRODUCTS
      .addCase(getProducts.pending, (state) => {
        state.product.loading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.product.items = action.payload.items;
        state.product.count = action.payload.count;
        state.product.loading = false;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.product.loading = false;
        state.product.error = action.payload as string;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.product.items.unshift(action.payload);
        state.product.count += 1;
      })
      .addCase(updateProductById.fulfilled, (state, action) => {
        const index = state.product.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.product.items[index] = action.payload;
        }
      })
      .addCase(deleteProductById.fulfilled, (state, action) => {
        state.product.items = state.product.items.filter(
          (item) => item.id !== action.payload.id
        );
        state.product.count -= 1;
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
  },
});

export default adminAppSlice.reducer;
