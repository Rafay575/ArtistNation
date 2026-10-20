"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import ArtistDashboard from "@/components/ArtistDashboard";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  // Loading state while auth state is being resolved
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Route based on role
  if (user.isAdmin) {
    return <ExecutiveDashboard />;
  }

  return <ArtistDashboard />;
}