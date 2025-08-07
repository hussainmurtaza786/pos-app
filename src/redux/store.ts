import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/auth';
import inventoryReducer from './slices/inventorySlice';
const store = configureStore({
    reducer: {
        auth: authReducer,
        inventory: inventoryReducer
    }
})

export default store
export type AppDispatch = typeof store.dispatch;