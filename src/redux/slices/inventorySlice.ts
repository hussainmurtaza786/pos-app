import { createSlice } from '@reduxjs/toolkit';
import createInventoryItem, { deleteInventoryItem, fetchInventory, updateInventoryItem } from '../thunks/inventoryApiThunk';

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    cost: number;
    category?: string;
    sku: string;
}

interface InventoryState {
    items: InventoryItem[];
    loading: boolean;
    error: string | null;
}

const initialState: InventoryState = {
    items: [],
    loading: false,
    error: null,
};
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // FETCH
            .addCase(fetchInventory.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchInventory.fulfilled, (state, action) => {
                state.items = action.payload;
                state.loading = false;
            })
            .addCase(fetchInventory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // CREATE
            .addCase(createInventoryItem.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // UPDATE
            .addCase(updateInventoryItem.fulfilled, (state, action) => {
                const index = state.items.findIndex((item: any) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            // DELETE
            .addCase(deleteInventoryItem.fulfilled, (state, action) => {
                state.items = state.items.filter((item: any) => item.id !== action.payload);
            });
    },
});

export default inventorySlice.reducer;
