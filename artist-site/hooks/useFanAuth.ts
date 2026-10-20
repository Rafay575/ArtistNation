"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function useFanAuth() {
  const fanAuth = useSelector((state: RootState) => state.fanAuth);

  return {
    fan: fanAuth.fan,
    fanToken: fanAuth.token,      // renamed from 'token' to 'fanToken'
    isLoggedIn: fanAuth.isAuthenticated,
    loading: false,
  };
}