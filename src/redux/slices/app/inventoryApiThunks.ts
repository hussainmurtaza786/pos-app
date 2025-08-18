import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { InventoryPutInput, InventoryPutOutput, InventoriesGetInput, InventoriesGetOutput } from "@/app/api/inventory/route";
import { InventoryDeleteOutput, InventoryGetOutput, InventoryPostInput, InventoryPostOutput } from "@/app/api/inventory/[id]/route";


export const getInventories = createAsyncThunk(
  "adminApp/getInventories",
  async (params: InventoriesGetInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoriesGetOutput>(
        `/api/inventory/`, { params }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const addInventory = createAsyncThunk(
  "adminApp/addInventory",
  async (body: InventoryPutInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.put<InventoryPutOutput>(
        `/api/inventory/`, body
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deleteInventoryById = createAsyncThunk(
  "adminApp/deleteInventory",
  async (inventoryId: string, thunkAPI) => {
    console.log("Deleting inventory with ID:", inventoryId);
    try {
      const response = await authorizedApiClient.delete<InventoryDeleteOutput>(
        `/api/inventory/${inventoryId}`
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const getInventoryById = createAsyncThunk(
  "adminApp/getInventoryById",
  async (inventoryId: string, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<InventoryGetOutput>(
        `/api/inventory/${inventoryId}`
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const updateInventoryById = createAsyncThunk(
  "adminApp/updateInventoryById",
  async (body: InventoryPostInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.post<InventoryPostOutput>(
        `/api/inventory/${body.id}`, body
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

