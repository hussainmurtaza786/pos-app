import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { CategoryPostInput, CategoryPostOutput, CategoriesGetOutput, } from "@/app/api/category/route";

// ✅ Get all categories
export const getCategories = createAsyncThunk(
  "adminApp/getCategories",
  async (_, thunkAPI) => {
    try {
      const response = await authorizedApiClient.get<CategoriesGetOutput>(
        `/api/category`
      );
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to fetch categories"
      );
    }
  }
);

// ✅ Add a new category
export const addCategory = createAsyncThunk(
  "adminApp/addCategory",
  async (body: CategoryPostInput, thunkAPI) => {
    try {
      const response = await authorizedApiClient.post<CategoryPostOutput>(
        `/api/category`,
        body
      );
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to add category"
      );
    }
  }
);
