import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorizedApiClient } from "@/utils";
import { ExpensePutInput, ExpensePutOutput, ExpensesGetInput, ExpensesGetOutput } from "@/app/api/expenses/route";
import { ExpenseDeleteOutput, ExpenseGetOutput, ExpensePostInput, ExpensePostOutput } from "@/app/api/expenses/[id]/route";



// -------------------------
// GET all expenses
// -------------------------
export const getExpenses = createAsyncThunk(
    "adminApp/getExpenses",
    async (params: ExpensesGetInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ExpensesGetOutput>(
                `/api/expenses/`,
                { params, withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error?.response?.data || { error: "Request failed" }
            );
        }
    }
);

// -------------------------
// ADD expense
// -------------------------
export const addExpense = createAsyncThunk(
    "adminApp/addExpense",
    async (body: ExpensePutInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.put<ExpensePutOutput>(
                `/api/expenses/`,
                body,
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error?.response?.data || { error: "Request failed" }
            );
        }
    }
);

// -------------------------
// DELETE expense by ID
// -------------------------
export const deleteExpenseById = createAsyncThunk(
    "adminApp/deleteExpense",
    async (expenseId: string, thunkAPI) => {
        try {
            const response = await authorizedApiClient.delete<ExpenseDeleteOutput>(
                `/api/expenses/${expenseId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error?.response?.data || { error: "Request failed" }
            );
        }
    }
);

// -------------------------
// GET expense by ID
// -------------------------
export const getExpenseById = createAsyncThunk(
    "adminApp/getExpenseById",
    async (expenseId: string, thunkAPI) => {
        try {
            const response = await authorizedApiClient.get<ExpenseGetOutput>(
                `/api/expenses/${expenseId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error?.response?.data || { error: "Request failed" }
            );
        }
    }
);

// -------------------------
// UPDATE expense by ID
// -------------------------
export const updateExpenseById = createAsyncThunk(
    "adminApp/updateExpenseById",
    async (body: ExpensePostInput, thunkAPI) => {
        try {
            const response = await authorizedApiClient.post<ExpensePostOutput>(
                `/api/expenses/${body.id}`,
                body,
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(
                error?.response?.data || { error: "Request failed" }
            );
        }
    }
);
