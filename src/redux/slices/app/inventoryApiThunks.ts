import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import {
  InventoryPutInput,
  InventoryPutOutput,
  InventoriesGetInput,
  InventoriesGetOutput,
} from "@/app/api/inventory/route";
import {
  InventoryDeleteOutput,
  InventoryGetOutput,
  InventoryPostInput,
  InventoryPostOutput,
} from "@/app/api/inventory/[id]/route";

// List / paginated
export const getInventories = createAsyncThunk(
  "adminApp/getInventories",
  async (params: InventoriesGetInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoriesGetOutput>(
        `/api/inventory/`,
        { params, withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);

// 🔎 Single-product inventory (uses GET /api/inventory?productId=...&pageSize=1)
export const getInventoryForProduct = createAsyncThunk(
  "adminApp/getInventoryForProduct",
  async (productId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoriesGetOutput>(
        `/api/inventory/`,
        { params: { pageNumber: 1, pageSize: 1, productId }, withCredentials: true }
      );
      // return only the first row (or null)
      const item = response.data?.data?.items?.[0] ?? null;
      return { data: item };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);

// Create
export const addInventory = createAsyncThunk(
  "adminApp/addInventory",
  async (body: InventoryPutInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.put<InventoryPutOutput>(
        `/api/inventory/`,
        body,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);

// Delete by id
export const deleteInventoryById = createAsyncThunk(
  "adminApp/deleteInventory",
  async (inventoryId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.delete<InventoryDeleteOutput>(
        `/api/inventory/${inventoryId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);

// Get by id
export const getInventoryById = createAsyncThunk(
  "adminApp/getInventoryById",
  async (inventoryId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoryGetOutput>(
        `/api/inventory/${inventoryId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);

// Update by id
export const updateInventoryById = createAsyncThunk(
  "adminApp/updateInventoryById",
  async (body: InventoryPostInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.post<InventoryPostOutput>(
        `/api/inventory/${body.id}`,
        body,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || { error: "Request failed" });
    }
  }
);
