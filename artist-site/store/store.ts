import { configureStore } from "@reduxjs/toolkit";
import fanAuthReducer from "./fanAuthSlice"; // new fan auth

export const store = configureStore({
  reducer: {
    fanAuth: fanAuthReducer,
    // add other reducers if needed (cart, etc.)
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;