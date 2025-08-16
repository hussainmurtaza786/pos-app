
import { User } from "@prisma/client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface StateType {
    userDetails: Omit<User, 'password'> | null;
    isAuthenticated: Boolean
    authToken: null | string
}
const initialState: StateType = {
    isAuthenticated: false,
    authToken: null,
    userDetails: null
}
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        updateAuthData(state, { payload }: PayloadAction<Pick<StateType, 'authToken' | 'userDetails'>>) {
            state.authToken = payload.authToken;
            state.userDetails = payload.userDetails;
            state.isAuthenticated = Boolean(payload.authToken);
        },
        resetState: () => initialState,
        logout: () => initialState
    },
    extraReducers: (builder) => {



    }
})

export default authSlice.reducer;
export const { logout, resetState, updateAuthData } = authSlice.actions;
export { }

