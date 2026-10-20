"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api as axios } from "@/lib/api";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface PickupLocation {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_active: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
} as const;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

export default function PickupLocationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PickupLocation | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    isActive: true,
  });

  // Fetch locations
  const { data: locations, isLoading, error } = useQuery<PickupLocation[]>({
    queryKey: ["pickupLocations"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/pickup-locations");
      return res.data;
    },
  });

  const filteredLocations = locations?.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.address?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (loc.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ) || [];

  // Stats (optional – you can keep or remove these cards, but I included for consistency)
  const totalLocations = locations?.length || 0;
  const activeLocations = locations?.filter((l) => l.is_active).length || 0;
  const inactiveLocations = totalLocations - activeLocations;

  const stats = [
    { id: 1, label: "Total Locations", value: totalLocations.toString(), iconBg: "bg-indigo-50" },
    { id: 2, label: "Active", value: activeLocations.toString(), iconBg: "bg-emerald-50" },
    { id: 3, label: "Inactive", value: inactiveLocations.toString(), iconBg: "bg-amber-50" },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => axios.post("/api/admin/pickup-locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupLocations"] });
      toast.success("Location created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create location"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      axios.put(`/api/admin/pickup-locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupLocations"] });
      toast.success("Location updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update location"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/admin/pickup-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickupLocations"] });
      toast.success("Location deleted");
    },
    onError: () => toast.error("Failed to delete location"),
  });

  const openCreateDialog = () => {
    setEditingLocation(null);
    setForm({ name: "", address: "", city: "", state: "", postalCode: "", isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (location: PickupLocation) => {
    setEditingLocation(location);
    setForm({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      postalCode: location.postal_code || "",
      isActive: location.is_active === 1,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      postalCode: form.postalCode || null,
      isActive: form.isActive,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

 const handleDelete = (location: PickupLocation) => {
  setDeleteTarget(location);
};

const confirmDelete = () => {
  if (deleteTarget) {
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }
};
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load locations. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Pickup Locations</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage where customers can pick up their orders
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> Add Location
          </Button>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                {/* Icons */}
                {stat.id === 1 && (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {stat.id === 2 && (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {stat.id === 3 && (
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search + Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Locations</h2>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Sr</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Address</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">City</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc,index) => (
                  <motion.tr
                    key={loc.id}
                    variants={tableRow}
                    whileHover={{ backgroundColor: "#faf5ff" }}
                    className="border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-gray-800 font-medium">{index+1}</td>
                    <td className="px-5 py-3 text-sm text-gray-800 font-medium">{loc.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{loc.address || "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{loc.city || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge className={loc.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50"}>
                        {loc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(loc)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(loc)}>
  <Trash2 className="w-4 h-4 text-red-500" />
</Button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                    No locations match your search.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </motion.div>
      </div>

      {/* Create/Edit Dialog – same clean style as before */}
      {/* Create/Edit Dialog – smoother open/close */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent
    className="sm:max-w-md duration-300 ease-out
      data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
      data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2"
  >
    <DialogHeader>
      <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
    </DialogHeader>

    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Main Store"
          className="transition-shadow duration-200 focus:shadow-md"
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <label className="block text-sm font-medium mb-1">Address</label>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="123 Artist Ave"
          className="transition-shadow duration-200 focus:shadow-md"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="New York"
            className="transition-shadow duration-200 focus:shadow-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <Input
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            placeholder="NY"
            className="transition-shadow duration-200 focus:shadow-md"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <label className="block text-sm font-medium mb-1">Postal Code</label>
        <Input
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          placeholder="10001"
          className="transition-shadow duration-200 focus:shadow-md"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <Switch checked={form.isActive} onCheckedChange={(val) => setForm({ ...form, isActive: val })} />
        <span className="text-sm">Active</span>
      </motion.div>

      <motion.div variants={fadeUp}>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog} className="transition-transform duration-150 active:scale-95">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="transition-transform duration-150 active:scale-95"
          >
            {editingLocation ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </motion.div>
    </motion.form>
  </DialogContent>
</Dialog>

{/* Delete Confirmation Dialog */}
<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <DialogContent
    className="sm:max-w-sm duration-300 ease-out
      data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
      data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2"
  >
    <DialogHeader>
      <DialogTitle>Delete Location</DialogTitle>
    </DialogHeader>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="flex items-start gap-3 py-2"
    >
      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
        <Trash2 className="w-4 h-4 text-red-500" />
      </div>
      <p className="text-sm text-gray-600">
        Are you sure you want to delete{" "}
        <span className="font-medium text-gray-900">{deleteTarget?.name}</span>?
        This action cannot be undone.
      </p>
    </motion.div>

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={() => setDeleteTarget(null)}
        className="transition-transform duration-150 active:scale-95"
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={confirmDelete}
        disabled={deleteMutation.isPending}
        className="bg-red-600 hover:bg-red-700 text-white transition-transform duration-150 active:scale-95"
      >
        {deleteMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Delete"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}