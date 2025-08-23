import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { ProductInOrdersGetInput, ProductInOrdersGetOutput, ProductInOrderPutInput, ProductInOrderPutOutput, } from "@/app/api/productInOrder/route";
import { ProductInOrderGetOutput, ProductInOrderPostInput, ProductInOrderPostOutput, ProductInOrderDeleteOutput, } from "@/app/api/productInOrder/[id]/route";

// -------------------------
// GET all ProductInOrders
// -------------------------
export const getProductInOrders = createAsyncThunk(
    "adminApp/getProductInOrders",
    async (params: ProductInOrdersGetInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ProductInOrdersGetOutput>(
                `/api/productInOrder/`,
                { params }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// -------------------------
// ADD ProductInOrder
// -------------------------
export const addProductInOrder = createAsyncThunk(
    "adminApp/addProductInOrder",
    async (body: ProductInOrderPutInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.put<ProductInOrderPutOutput>(
                `/api/productInOrder/`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// -------------------------
// DELETE ProductInOrder by composite id (orderId-productId)
// -------------------------
export const deleteProductInOrderById = createAsyncThunk(
    "adminApp/deleteProductInOrder",
    async ({ orderId, productId }: { orderId: number; productId: string }, thunkAPI) => {
        // compositeId must be in "orderId-productId" format
        try {
            const response = await authorizedApiClient.delete<ProductInOrderDeleteOutput>(
                `/api/productInOrder/${orderId}-${productId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// -------------------------
// GET ProductInOrder by composite id (orderId-productId)
// -------------------------
export const getProductInOrderById = createAsyncThunk(
    "adminApp/getProductInOrderById",
    async ({ orderId, productId }: { orderId: number; productId: string }, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ProductInOrderGetOutput>(
                `/api/productInOrder/${orderId}-${productId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// -------------------------
// UPDATE ProductInOrder by composite id
// -------------------------
export const updateProductInOrderById = createAsyncThunk(
    "adminApp/updateProductInOrderById",
    async (body: ProductInOrderPostInput, thunkAPI) => {
        try {
            const compositeId = `${body.id.orderId}-${body.id.productId}`;
            const response = await authorizedApiClient.post<ProductInOrderPostOutput>(
                `/api/productInOrder/${compositeId}`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);
