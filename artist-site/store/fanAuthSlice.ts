import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Fan {
  id: number;
  email: string;
  fullName: string;
  isVerified: boolean;
}

interface FanAuthState {
  token: string | null;
  fan: Fan | null;
  isAuthenticated: boolean;
}

// ---------- Read from localStorage on client side ----------
const getInitialState = (): FanAuthState => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fanToken");
    const user = localStorage.getItem("fanUser");
    if (token && user) {
      try {
        const fan = JSON.parse(user) as Fan;
        return {
          token,
          fan,
          isAuthenticated: true,
        };
      } catch {
        // invalid JSON, ignore
      }
    }
  }
  return {
    token: null,
    fan: null,
    isAuthenticated: false,
  };
};

const initialState: FanAuthState = getInitialState();

// ---------- Slice ----------
const fanAuthSlice = createSlice({
  name: "fanAuth",
  initialState,
  reducers: {
    fanLoginSuccess: (state, action: PayloadAction<{ token: string; fan: Fan }>) => {
      const { token, fan } = action.payload;
      state.token = token;
      state.fan = fan;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("fanToken", token);
        localStorage.setItem("fanUser", JSON.stringify(fan));
      }
    },
    fanLogout: (state) => {
      state.token = null;
      state.fan = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("fanToken");
        localStorage.removeItem("fanUser");
      }
    },
  },
});

export const { fanLoginSuccess, fanLogout } = fanAuthSlice.actions;
export default fanAuthSlice.reducer;