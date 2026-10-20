"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api as axios } from "@/lib/api";
import {
  Loader2,
  PackageOpen,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  fan_id: number;
  fan_name: string | null;
  fan_email: string | null;
  fan_is_verified: number | boolean;
  total: number;
  status: "processing" | "declined" | "completed";
  pickup_location: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  created_at: string;
  payment_intent_id?: string;
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

const statusStyles: Record<string, { badge: string; icon: React.ReactNode; dot: string }> = {
  processing: {
    badge: "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100",
    icon: <Clock className="w-3 h-3" />,
    dot: "bg-blue-500",
  },
  declined: {
    badge: "bg-red-50 text-red-700 hover:bg-red-50 border border-red-100",
    icon: <XCircle className="w-3 h-3" />,
    dot: "bg-red-500",
  },
  completed: {
    badge: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100",
    icon: <CheckCircle2 className="w-3 h-3" />,
    dot: "bg-emerald-500",
  },
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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const limit = 10;

  const { data, isLoading, isError } = useQuery<OrdersResponse>({
    queryKey: ["adminOrders", page, statusFilter, startDate, endDate],
    queryFn: async () => {
      const params: any = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axios.get("/api/admin/orders", { params });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      axios.put(`/api/admin/orders/${orderId}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      toast.success("Status updated");
      // keep the modal's local view of status in sync if it's open
      setSelectedOrder((prev) =>
        prev && prev.id === variables.orderId ? { ...prev, status: variables.status as Order["status"] } : prev
      );
    },
    onError: () => toast.error("Failed to update status"),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const handlePageChange = (newPage: number) => setPage(newPage);

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const totalOrders = pagination?.total || 0;
  const processingOrders = orders.filter((o) => o.status === "processing").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const declinedOrders = orders.filter((o) => o.status === "declined").length;

  const stats = [
    { id: 1, label: "Total Orders", value: totalOrders.toString(), iconBg: "bg-indigo-50", color: "text-indigo-600" },
    { id: 2, label: "Processing", value: processingOrders.toString(), iconBg: "bg-blue-50", color: "text-blue-600" },
    { id: 3, label: "Completed", value: completedOrders.toString(), iconBg: "bg-emerald-50", color: "text-emerald-600" },
    { id: 4, label: "Declined", value: declinedOrders.toString(), iconBg: "bg-red-50", color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer orders and their status</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                {stat.id === 1 && <Receipt className={`w-5 h-5 ${stat.color}`} />}
                {stat.id === 2 && <Clock className={`w-5 h-5 ${stat.color}`} />}
                {stat.id === 3 && <CheckCircle2 className={`w-5 h-5 ${stat.color}`} />}
                {stat.id === 4 && <XCircle className={`w-5 h-5 ${stat.color}`} />}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex gap-3 flex-wrap items-center bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
        >
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 h-9 text-sm transition-shadow focus:shadow-md">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-40 h-9 text-sm transition-shadow focus:shadow-md"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-40 h-9 text-sm transition-shadow focus:shadow-md"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="transition-transform duration-150 active:scale-95"
          >
            Clear
          </Button>
        </motion.div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : isError ? (
          <div className="text-center text-red-500 py-12">Failed to load orders.</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <PackageOpen className="w-10 h-10" />
            <p className="text-sm">No orders found.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {orders.map((order) => {
                  const style = statusStyles[order.status];
                  return (
                    <motion.tr
                      key={order.id}
                      variants={tableRow}
                      whileHover={{ backgroundColor: "#faf5ff" }}
                      onClick={() => setSelectedOrder(order)}
                      className="border-b border-gray-100 last:border-0 transition-colors cursor-pointer group"
                    >
                      <TableCell className="font-medium text-gray-800">#{order.id}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-800">{order.first_name} {order.last_name}</div>
                        <div className="text-xs text-gray-400">{order.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i}>{item.title} × {item.quantity}</div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-gray-400">+{order.items.length - 2} more</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">${order.total}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) =>
                            updateStatusMutation.mutate({ orderId: order.id, status: newStatus })
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-xs border-0 shadow-none p-0 focus:ring-0">
                            <Badge className={`gap-1.5 ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {order.status[0].toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{order.pickup_location}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </Table>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === page} onClick={() => handlePageChange(p)}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className={page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent
          className="sm:max-w-lg duration-300 ease-out
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2"
        >
          <AnimatePresence mode="wait">
            {selectedOrder && (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between pr-6">
                    <span>Order #{selectedOrder.id}</span>
                    <Badge className={`gap-1.5 ${statusStyles[selectedOrder.status].badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[selectedOrder.status].dot}`} />
                      {selectedOrder.status[0].toUpperCase() + selectedOrder.status.slice(1)}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-5 mt-2"
                >
                  {/* Meta row */}
                  <motion.div variants={fadeUp} className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </motion.div>
                    {selectedOrder.fan_id && (
  <motion.div variants={fadeUp} className="bg-gray-50 rounded-lg p-4 space-y-2">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
      Fan Account
    </p>
    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
      <User className="w-4 h-4 text-gray-400" />
      {selectedOrder.fan_name || "—"}
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Mail className="w-4 h-4 text-gray-400" />
      {selectedOrder.fan_email || "—"}
    </div>
    <div className="flex items-center gap-2 text-sm">
      {selectedOrder.fan_is_verified ? (
        <>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-700">Verified</span>
        </>
      ) : (
        <>
          <ShieldOff className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">Not verified</span>
        </>
      )}
    </div>
  </motion.div>
)}
                  {/* Customer info */}
                  <motion.div variants={fadeUp} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <User className="w-4 h-4 text-gray-400" />
                      {selectedOrder.first_name} {selectedOrder.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedOrder.email}
                    </div>
                    {selectedOrder.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedOrder.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedOrder.pickup_location}
                    </div>
                  </motion.div>

                  {/* Items */}
                  <motion.div variants={fadeUp}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <span className="text-gray-800">{item.title}</span>
                            <span className="text-gray-400"> × {item.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Total */}
                  <motion.div
                    variants={fadeUp}
                    className="flex items-center justify-between pt-2 border-t border-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-500">Total</span>
                    <span className="text-lg font-bold text-gray-900">${selectedOrder.total}</span>
                  </motion.div>

                  {/* Status control */}
                  <motion.div variants={fadeUp} className="flex items-center justify-between pt-1">
                    <span className="text-sm text-gray-500">Update status</span>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(newStatus) =>
                        updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus })
                      }
                    >
                      <SelectTrigger className="w-36 h-9 text-sm transition-shadow focus:shadow-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}