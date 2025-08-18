import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { ProductPutInput, ProductPutOutput, ProductsGetInput, ProductsGetOutput } from "@/app/api/product/route";
import { ProductDeleteOutput, ProductGetOutput, ProductPostInput, ProductPostOutput } from "@/app/api/product/[id]/route";


export const getProducts = createAsyncThunk(
    "adminApp/getProducts",
    async (params: ProductsGetInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ProductsGetOutput>(
                `/api/product/`, { params }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const addProduct = createAsyncThunk(
    "adminApp/addProduct",
    async (body: ProductPutInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.put<ProductPutOutput>(
                `/api/product/`, body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const deleteProductById = createAsyncThunk(
    "adminApp/deleteProduct",
    async (productId: string, thunkAPI) => {
        try {
            const response = await authorizedApiClient.delete<ProductDeleteOutput>(
                `/api/product/${productId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const getProductById = createAsyncThunk(
    "adminApp/getProductById",
    async (productId: string, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ProductGetOutput>(
                `/api/product/${productId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const updateProductById = createAsyncThunk(
    "adminApp/updateProductById",
    async (body: ProductPostInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.post<ProductPostOutput>(
                `/api/product/${body.id}`, body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

