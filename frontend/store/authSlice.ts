import { createSlice, PayloadAction } from '@reduxjs/toolkit';
interface User {
  id: number; email: string; fullName: string; isVerified: boolean;
  isOnboarded: boolean; isAdmin: boolean; redirectUrl?: string; canManage?: boolean;
}
interface AuthState { token: string | null; user: User | null; isAuthenticated: boolean; initialized: boolean }
const initialState: AuthState = { token: null, user: null, isAuthenticated: false, initialized: false };
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token?: string; user: User }>) => {
      state.token = 'session';
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.initialized = true;
    },
    logout: state => { state.token = null; state.user = null; state.isAuthenticated = false; state.initialized = true; },
    updateUser: (state, action: PayloadAction<User>) => { state.user = action.payload; },
  },
});
export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
