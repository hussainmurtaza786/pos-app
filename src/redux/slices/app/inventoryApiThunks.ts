import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";

// Import types from API route files
import { InventoryPutInput,  InventoryPutOutput,  InventoriesGetInput,  InventoriesGetOutput,} from "@/app/api/inventory/route";

import { InventoryDeleteOutput,  InventoryGetOutput,  InventoryPostInput,  InventoryPostOutput,} from "@/app/api/inventory/[id]/route";

// ✅ Get all inventories with optional filters
export const getInventories = createAsyncThunk(
  "adminApp/getInventories",
  async (params: InventoriesGetInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoriesGetOutput>(
        `/api/inventory`,
        { params }
      );
    return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to fetch inventories");
    }
  }
);

// ✅ Add a new inventory (PUT request)
export const addInventory = createAsyncThunk(
  "adminApp/addInventory",
  async (body: InventoryPutInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.put<InventoryPutOutput>(
        `/api/inventory`,
        body
      );
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to add inventory");
    }
  }
);

// ✅ Get a single inventory by ID
export const getInventoryById = createAsyncThunk(
  "adminApp/getInventoryById",
  async (inventoryId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoryGetOutput>(
        `/api/inventory/${inventoryId}`
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to fetch inventory");
    }
  }
);

// ✅ Update inventory by ID (POST request)
export const updateInventoryById = createAsyncThunk(
  "adminApp/updateInventoryById",
  async (body: InventoryPostInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.post<InventoryPostOutput>(
        `/api/inventory/${body.id}`,
        body
      );
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to update inventory");
    }
  }
);

// ✅ Delete inventory by ID
export const deleteInventoryById = createAsyncThunk(
  "adminApp/deleteInventory",
  async (inventoryId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.delete<InventoryDeleteOutput>(
        `/api/inventory/${inventoryId}`
      );
    //   return response.data;
      return { id: inventoryId }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to delete inventory");
    }
  }
);
