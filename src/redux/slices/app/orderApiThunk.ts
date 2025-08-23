import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { OrderPutInput, OrderPutOutput, OrdersGetInput, OrdersGetOutput, } from "@/app/api/order/route";
import { OrderDeleteOutput, OrderGetOutput, OrderPostInput, OrderPostOutput } from "@/app/api/order/[id]/route";

// -------------------------
// GET all orders
// -------------------------
export const getOrders = createAsyncThunk(
    "adminApp/getOrders",
    async (params: OrdersGetInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<OrdersGetOutput>(
                `/api/order/`,
                { params }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// CREATE new order
// -------------------------
export const addOrder = createAsyncThunk(
    "adminApp/addOrder",
    async (body: OrderPutInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.put<OrderPutOutput>(
                `/api/order/`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// DELETE order by ID
// -------------------------
export const deleteOrderById = createAsyncThunk(
    "adminApp/deleteOrderById",
    async (orderId: number, thunkAPI) => {
        try {
            const response = await authorizedApiClient.delete<OrderDeleteOutput>(
                `/api/order/${orderId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// GET order by ID
// -------------------------
export const getOrderById = createAsyncThunk(
    "adminApp/getOrderById",
    async (orderId: number, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<OrderGetOutput>(
                `/api/order/${orderId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// UPDATE order by ID
// -------------------------
export const updateOrderById = createAsyncThunk(
    "adminApp/updateOrderById",
    async (body: OrderPostInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.post<OrderPostOutput>(
                `/api/order/${body.id}`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);
