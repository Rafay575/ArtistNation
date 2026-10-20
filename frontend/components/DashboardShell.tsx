// app/dashboard/layout.tsx
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubscriptionToastManager from "@/components/SubscriptionToastManager"; // ✅ Import

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
        suppressHydrationWarning
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          
          {/* ✅ Subscription Toast Manager - shows cancel notification */}
          <SubscriptionToastManager />
          
          {/* Page content */}
          <div className="flex flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}