import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/auth';
import adminAppSlice from './slices/app/';
const store = configureStore({
    reducer: {
        auth: authReducer,
        app: adminAppSlice
    }
})

export default store
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
