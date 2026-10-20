"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  ChevronDownIcon,
  SettingsIcon,
  ImageIcon,
  FileTextIcon,
  LayoutIcon,
  DollarSignIcon,
  LocateIcon,
  MessageCircle,
} from "lucide-react";
import {
 
  MailIcon,
  MailPlusIcon,
  CreditCardIcon,
  
  LayoutTemplateIcon,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.isAdmin ?? false;

  // Common items that all authenticated users see
const navMain = isAdmin
  ? [
     { 
    title: "Dashboard", 
    url: "/admin/dashboard", 
    icon: <LayoutDashboardIcon className="w-4 h-4" /> 
  },
  { 
    title: "Users", 
    url: "/admin/users", 
    icon: <UsersIcon className="w-4 h-4" /> 
  },
  { 
    title: "CMS Admin", 
    url: "/admin/cms-admin", 
    icon: <LayoutTemplateIcon className="w-4 h-4" /> 
  },
  { 
    title: "Contact Submissions", 
    url: "/admin/contact", 
    icon: <MailIcon className="w-4 h-4" /> 
  },
  { 
    title: "Subscribers", 
    url: "/admin/admin-subscribers", 
    icon: <MailPlusIcon className="w-4 h-4" /> 
  },
  { 
    title: "Payments", 
    url: "/admin/payments", 
    icon: <CreditCardIcon className="w-4 h-4" /> 
  },
    ]
    : [
      { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
      {
        title: "CMS",
        icon: <ListIcon />,
        items: [
          { title: "Sections", url: "/admin/cms", icon: <LayoutIcon /> },
          { title: "Header & Footer", url: "/admin/navbar-footer", icon: <ImageIcon /> },
        ],
      },
      { title: "Billings", url: "/admin/billings", icon: <FolderIcon /> },
      { title: "Fans", url: "/admin/fans", icon: <UsersIcon /> },
      { title: "Stripe Integration", url: "/admin/payment-integration", icon: <DollarSignIcon /> },
      { title: "Pickup Locations", url: "/admin/pickup-locations", icon: <LocateIcon /> },
      { title: "Orders", url: "/admin/orders", icon: <FileTextIcon /> },
      { title: "Inquires", url: "/admin/contact-submissions", icon: <MessageCircle /> },
      { title: "Subscribers", url: "/admin/subscribers", icon: <UsersIcon /> },
    ];

  // --- everything else stays exactly the same (collapsible logic, sidebar structure) ---
  const isCmsActive = navMain.some(
    (item) => item.items && item.items.some((sub) => pathname === sub.url)
  );
  const [openCms, setOpenCms] = React.useState(isCmsActive);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <Link href="/admin/dashboard">
          <img src="/logo-dark.png" alt="logo" className="h-[40px] w-auto" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="mt-10">
        <SidebarMenu suppressHydrationWarning>
          {navMain.map((item) => {
            if (item.items) {
              return (
                <Collapsible
                  key={item.title}
                  open={openCms}
                  onOpenChange={setOpenCms}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon}
                        <span>{item.title}</span>
                        <ChevronDownIcon
                          className={`ml-auto transition-transform ${
                            openCms ? "rotate-180" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === sub.url}
                            >
                              <Link href={sub.url} className="flex items-center gap-2">
                                {sub.icon}
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}