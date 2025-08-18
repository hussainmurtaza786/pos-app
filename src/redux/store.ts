import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/auth';
import adminAppSlice from './slices/app/';
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
const store = configureStore({
    reducer: {
        auth: authReducer,
        app: adminAppSlice
    }
})

export default store
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector