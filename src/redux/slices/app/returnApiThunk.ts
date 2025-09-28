import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { ReturnPutInput, ReturnPutOutput, ReturnsGetInput, ReturnsGetOutput, } from "@/app/api/return/route";
import { ReturnDeleteOutput, ReturnGetOutput, ReturnPostInput, ReturnPostOutput, } from "@/app/api/return/[id]/route";

// -------------------------
// GET all return orders
// -------------------------
export const getReturns = createAsyncThunk(
    "adminApp/getReturns",
    async (params: ReturnsGetInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ReturnsGetOutput>(
                `/api/return/`,
                { params }
            );
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// CREATE new return order
// -------------------------
export const addReturn = createAsyncThunk(
    "adminApp/addReturn",
    async (body: ReturnPutInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.put<ReturnPutOutput>(
                `/api/return/`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// DELETE return order by ID
// -------------------------
export const deleteReturnById = createAsyncThunk(
    "adminApp/deleteReturnById",
    async (orderId: number, thunkAPI) => {
        try {
            const response = await authorizedApiClient.delete<ReturnDeleteOutput>(
                `/api/return/${orderId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// GET return order by ID
// -------------------------
export const getReturnById = createAsyncThunk(
    "adminApp/getReturnById",
    async (orderId: number, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ReturnGetOutput>(
                `/api/return/${orderId}`
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);

// -------------------------
// UPDATE return order by ID
// -------------------------
export const updateReturnById = createAsyncThunk(
    "adminApp/updateReturnById",
    async (body: ReturnPostInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.post<ReturnPostOutput>(
                `/api/return/${body.id}`,
                body
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data ?? error.message);
        }
    }
);
