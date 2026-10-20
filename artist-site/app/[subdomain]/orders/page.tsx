"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useArtist } from "@/contexts/ArtistContext";
import { useCart } from "@/contexts/CartContext";
import CartModal from "@/components/CartModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PackageOpen,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { HiOutlineShoppingCart } from "react-icons/hi";
import toast from "react-hot-toast";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  pickup_location: string;
  first_name: string;
  last_name: string;
  email: string;
  items: OrderItem[];
  created_at: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  pending: { badge: "bg-amber-50 text-amber-700 border border-amber-100", dot: "bg-amber-500" },
  processing: { badge: "bg-blue-50 text-blue-700 border border-blue-100", dot: "bg-blue-500" },
  completed: { badge: "bg-emerald-50 text-emerald-700 border border-emerald-100", dot: "bg-emerald-500" },
  cancelled: { badge: "bg-red-50 text-red-700 border border-red-100", dot: "bg-red-500" },
  declined: { badge: "bg-red-50 text-red-700 border border-red-100", dot: "bg-red-500" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
} as const;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

export default function OrdersPage() {
  const router = useRouter();
  const { settings } = useArtist();
  const { items: cartItems } = useCart();

  const [fanUser, setFanUser] = useState<any>(null);
  const [fanToken, setFanToken] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const limit = 10;

  const primaryColor = settings?.primary_color || "#5D2FDB";

  useEffect(() => {
    const token = localStorage.getItem("fanToken");
    const user = localStorage.getItem("fanUser");
    if (token && user) {
      setFanToken(token);
      setFanUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fanToken");
    localStorage.removeItem("fanUser");
    setFanToken(null);
    setFanUser(null);
    setDropdownOpen(false);
    toast.success("Logged out");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const initials = fanUser ? getInitials(fanUser.fullName || "Fan") : "";
  const isLoggedIn = !!fanUser && !!fanToken;

  const { data, isLoading, isError } = useQuery<OrdersResponse>({
    queryKey: ["fanOrders", page, statusFilter, startDate, endDate],
    queryFn: async () => {
      const params: any = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/fan/orders`, {
        params,
        headers: { Authorization: `Bearer ${fanToken}` },
      });
      return res.data;
    },
    enabled: isLoggedIn,
    retry: 1,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      order.first_name.toLowerCase().includes(term) ||
      order.last_name.toLowerCase().includes(term) ||
      order.email.toLowerCase().includes(term)
    );
  });

  const handlePageChange = (newPage: number) => setPage(newPage);

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  // Same cart + avatar UI/behavior as Navbar
  const TopBar = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <HiOutlineShoppingCart size={22} className="text-gray-700" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-100 transition"
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {initials}
                </div>
                <span className="text-sm text-gray-700">{fanUser.fullName?.split(" ")[0]}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <span className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-default">
                    Orders
                  </span>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fbfaf8]">
        {TopBar}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center"
        >
          <PackageOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-500">Please sign in to view your orders.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
      {TopBar}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-2xl font-bold text-gray-900 mb-1"
        >
          My Orders
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-gray-400 mb-8"
        >
          Track and review everything you've ordered
        </motion.p>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-8 bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
        >
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm transition-shadow focus:shadow-md">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-400 whitespace-nowrap">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-[150px] h-9 text-sm transition-shadow focus:shadow-md"
            />
            <label className="text-xs text-gray-400 whitespace-nowrap">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-[150px] h-9 text-sm transition-shadow focus:shadow-md"
            />
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full h-9 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-shadow"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9 transition-transform active:scale-95"
          >
            Clear Filters
          </Button>
        </motion.div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-red-500">Failed to load orders.</div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <PackageOpen className="w-14 h-14 mx-auto text-gray-300 mb-4" />
            <p className="text-base text-gray-500">No orders found.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Order #</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Items</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Total</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Pickup</TableHead>
                </TableRow>
              </TableHeader>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {filteredOrders.map((order) => {
                  const style = STATUS_STYLES[order.status] || {
                    badge: "bg-gray-50 text-gray-700 border border-gray-100",
                    dot: "bg-gray-400",
                  };
                  return (
                    <motion.tr
                      key={order.id}
                      variants={tableRow}
                      whileHover={{ backgroundColor: "#faf5ff" }}
                      className="border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <TableCell className="px-5 py-3 text-sm font-medium text-gray-800">#{order.id}</TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {order.items.map((item, idx) => (
                            <li key={idx}>{item.title} × {item.quantity}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm font-semibold text-gray-900">${order.total}</TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge className={`gap-1.5 ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {order.status[0].toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 max-w-[150px] truncate">
                        {order.pickup_location}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </Table>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page > 1) handlePageChange(page - 1); }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (page < pagination.totalPages) handlePageChange(page + 1); }}
                    className={page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} primaryColor={primaryColor} />
    </div>
  );
}