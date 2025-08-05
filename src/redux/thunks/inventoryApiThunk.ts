import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = '/api/inventory';

export const fetchInventory = createAsyncThunk('inventory/fetchAll', async (_, thunkAPI) => {
  try {
    const response = await axios.get(API_BASE);
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory');
  }
});

export const createInventoryItem = createAsyncThunk(
  'inventory/create',
  async (data: {
    name: string;
    description?: string;
    quantity: number;
    price: number;
    cost: number;
    category?: string;
    sku: string;
  }, thunkAPI) => {
    try {
      const response = await axios.post(API_BASE, data);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to create item');
    }
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/update',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        description?: string;
        quantity: number;
        price: number;
        cost: number;
        category?: string;
        sku: string;
      };
    },
    thunkAPI
  ) => {
    try {
      const response = await axios.put(`${API_BASE}/${id}`, data);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to update item');
    }
  }
);

export const deleteInventoryItem = createAsyncThunk(
  'inventory/delete',
  async (id: string, thunkAPI) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      return id; // Return the deleted item's ID for removing it from state
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || 'Failed to delete item');
    }
  }
);


export default createInventoryItem;