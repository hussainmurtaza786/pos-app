import { createSlice } from '@reduxjs/toolkit';
import { addInventory, deleteInventoryById, getInventories, updateInventoryById } from './inventoryApiThunks';
import { Inventory } from '@/prisma/customTypes';


interface InventoryState {
    items: Inventory[];
    count?: number; // Optional count for total items, if needed
    loading: boolean;
    error: string | null;
}

const initialState: InventoryState = {
    items: [],
    loading: false,
    error: null,
    count: 0
};
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // FETCH
            .addCase(getInventories.pending, (state) => {
                state.loading = true;
            })
            .addCase(getInventories.fulfilled, (state, action) => {
                state.items = action.payload.items;
                state.count = action.payload.count;
                state.loading = false;
            })
            .addCase(getInventories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // CREATE
            .addCase(addInventory.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // UPDATE
            .addCase(updateInventoryById.fulfilled, (state, action) => {
                const index = state.items.findIndex((item: any) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            // DELETE
            .addCase(deleteInventoryById.fulfilled, (state, action) => {
                state.items = state.items.filter((item: any) => item.id !== action.payload);
            });
    },
});

export default inventorySlice.reducer;
